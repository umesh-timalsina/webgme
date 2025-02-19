/*globals define, WebGMEGlobal, _, alert*/
/*jshint browser: true*/
/*jscs:disable maximumLineLength*/

/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */

define(['js/logger',
    'js/util',
    'js/Constants',
    'js/UIEvents',
    'js/NodePropertyNames',
    'js/RegistryKeys',
    'js/Utils/GMEConcepts',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'js/DragDrop/DragHelper',
    'js/Dialogs/ReplaceBase/ReplaceBaseDialog',
    'js/Utils/Exporters',
    'js/Dialogs/ImportModel/ImportModelDialog',
], function (Logger,
             util,
             CONSTANTS,
             UI_EVENTS,
             nodePropertyNames,
             REGISTRY_KEYS,
             GMEConcepts,
             DiagramDesignerWidgetConstants,
             DragHelper,
             ReplaceBaseDialog,
             exporters,
             ImportModelDialog) {

    'use strict';

    var ModelEditorControlDiagramDesignerWidgetEventHandlers,
        ATTRIBUTES_STRING = 'attributes',
        REGISTRY_STRING = 'registry',
        SRC_POINTER_NAME = CONSTANTS.POINTER_SOURCE,
        DST_POINTER_NAME = CONSTANTS.POINTER_TARGET;

    ModelEditorControlDiagramDesignerWidgetEventHandlers = function () {
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype.attachDiagramDesignerWidgetEventHandlers = function () {
        var self = this;

        /*OVERRIDE DESIGNER CANVAS METHODS*/
        this.designerCanvas.onDesignerItemsMove = function (repositionDesc) {
            self._onDesignerItemsMove(repositionDesc);
        };
        /*
         this.designerCanvas.onDesignerItemsCopy = function (copyDesc) {
         self._onDesignerItemsCopy(copyDesc);
         };*/

        this.designerCanvas.onCreateNewConnection = function (params) {
            self._onCreateNewConnection(params);
        };

        this.designerCanvas.onSelectionDelete = function (idList) {
            self._onSelectionDelete(idList);
        };

        this.designerCanvas.onDesignerItemDoubleClick = function (id, event) {
            self._onDesignerItemDoubleClick(id, event);
        };

        this.designerCanvas.onModifyConnectionEnd = function (params) {
            self._onModifyConnectionEnd(params);
        };

        this.designerCanvas.onRegisterSubcomponent = function (objID, sCompID, metaInfo) {
            self._onRegisterSubcomponent(objID, sCompID, metaInfo);
        };

        this.designerCanvas.onUnregisterSubcomponent = function (objID, sCompID) {
            self._onUnregisterSubcomponent(objID, sCompID);
        };

        this.designerCanvas.onBackgroundDroppableAccept = function (event, dragInfo) {
            return self._onBackgroundDroppableAccept(event, dragInfo);
        };

        this.designerCanvas.onBackgroundDrop = function (event, dragInfo, position) {
            self._onBackgroundDrop(event, dragInfo, position);
        };

        this.designerCanvas.onSelectionChanged = function (selectedIds) {
            self._onSelectionChanged(selectedIds);
        };

        this.designerCanvas.onClipboardCopy = function (selectedIds) {
            self._onClipboardCopy(selectedIds);
        };

        this.designerCanvas.onClipboardPaste = function () {
            self._onClipboardPaste();
        };

        this.designerCanvas.onConnectionSegmentPointsChange = function (params) {
            self._onConnectionSegmentPointsChange(params);
        };

        this.designerCanvas.onFilterNewConnectionDroppableEnds = function (params) {
            return self._onFilterNewConnectionDroppableEnds(params);
        };

        this.designerCanvas.onFilterReconnectionDroppableEnds = function (params) {
            return self._onFilterReconnectionDroppableEnds(params);
        };

        this.designerCanvas.onDragStartDesignerItemDraggable = function (itemID) {
            return self._onDragStartDesignerItemDraggable(itemID);
        };

        this.designerCanvas.onDragStartDesignerItemCopyable = function (itemID) {
            return self._onDragStartDesignerItemCopyable(itemID);
        };

        this.designerCanvas.onDragStartDesignerConnectionCopyable = function (connectionID) {
            return self._onDragStartDesignerConnectionCopyable(connectionID);
        };

        this.designerCanvas.onSelectionRotated = function (deg, selectedIds) {
            return self._onSelectionRotated(deg, selectedIds);
        };

        this.designerCanvas.onSetConnectionProperty = function (params) {
            self._onSetConnectionProperty(params);
        };

        this.designerCanvas.onCopy = function () {
            return self._onCopy();
        };

        this.designerCanvas.onPaste = function (data) {
            return self._onPaste(data);
        };

        this.designerCanvas.getDragItems = function (selectedElements) {
            return self._getDragItems(selectedElements);
        };

        this._oGetDragParams = this.designerCanvas.getDragParams;
        this.designerCanvas.getDragParams = function (selectedElements, event) {
            return self._getDragParams(selectedElements, event);
        };

        this.designerCanvas.onSelectionContextMenu = function (selectedIds, mousePos) {
            self._onSelectionContextMenu(selectedIds, mousePos);
        };

        this.designerCanvas.onSelectionAlignMenu = function (selectedIds, mousePos) {
            self._onSelectionAlignMenu(selectedIds, mousePos);
        };

        this.designerCanvas.onSelectionFillColorChanged = function (selectedElements, color) {
            self._onSelectionFillColorChanged(selectedElements, color);
        };

        this.designerCanvas.onSelectionBorderColorChanged = function (selectedElements, color) {
            self._onSelectionBorderColorChanged(selectedElements, color);
        };

        this.designerCanvas.onSelectionTextColorChanged = function (selectedElements, color) {
            self._onSelectionTextColorChanged(selectedElements, color);
        };

        this.designerCanvas.onSelectedTabChanged = function (tabID) {
            self._onSelectedTabChanged(tabID);
        };

        this.designerCanvas.onAlignSelection = function (selectedIds, type) {
            self._onAlignSelection(selectedIds, type);
        };

        this.logger.debug('attachDiagramDesignerWidgetEventHandlers finished');
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._saveNewPositions = function (repositionDesc) {
        var self = this,
            gmeIds = Object.keys(repositionDesc),
            modelId = this.currentNodeInfo.id,
            gmeId,
            i,
            newPos;

        if (gmeIds.length === 0) {
            return;
        }

        this._client.startTransaction();
        for (i = 0; i < gmeIds.length; i += 1) {
            gmeId = gmeIds[i];
            newPos = {
                x: repositionDesc[gmeId].x,
                y: repositionDesc[gmeId].y
            };

            if (this._selectedAspect === CONSTANTS.ASPECT_ALL) {
                if (repositionDesc[gmeId][REGISTRY_STRING]) {
                    // This is for the line points..
                    Object.keys(repositionDesc[gmeId][REGISTRY_STRING]).forEach(function (regKey) {
                        self._client.setRegistry(gmeId,
                            regKey,
                            repositionDesc[gmeId][REGISTRY_STRING][regKey]);
                    });
                } else {
                    this._client.setRegistry(gmeId, REGISTRY_KEYS.POSITION, newPos);
                }
            } else {
                this._client.addMember(modelId, gmeId, this._selectedAspect);
                this._client.setMemberRegistry(modelId, gmeId, this._selectedAspect,
                    REGISTRY_KEYS.POSITION, newPos);
            }
        }

        this._client.completeTransaction();
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._addConnSegmentPoints = function (posInfo) {
        // This adds connection segments points that should be updated based on activeSelection.
        var self = this,
            connIds = WebGMEGlobal.State.getActiveSelection().filter(function (gmeId) {
                var nodeObj = self._client.getNode(gmeId);
                return nodeObj && nodeObj.isConnection();
            });

        connIds.forEach(function (gmeId) {
            var nodeObj = self._client.getNode(gmeId),
                linePoints = nodeObj && nodeObj.getRegistry(REGISTRY_KEYS.LINE_CUSTOM_POINTS);

            if (linePoints instanceof Array && linePoints.length > 0) {
                // There are linepoints defined - if the src and dst is part of the move
                // compute the "delta-move" (for any of them) and apply it to those points.
                var srcNode = nodeObj.getNode(nodeObj.getPointerId('src')),
                    dstNode = nodeObj.getNode(nodeObj.getPointerId('dst'));

                // Maybe src/dst are ports - check if their parents where selected..
                if (srcNode && !posInfo[srcNode.getId()]) {
                    srcNode = nodeObj.getNode(srcNode.getParentId());
                }

                if (dstNode && !posInfo[dstNode.getId()]) {
                    dstNode = nodeObj.getNode(dstNode.getParentId());
                }

                if (srcNode && posInfo[srcNode.getId()] && dstNode && posInfo[dstNode.getId()]) {
                    var srcPos = srcNode.getRegistry('position'),
                        dstPos = dstNode.getRegistry('position'),
                        delta = {x: 0, y: 0},
                        pos;

                    if (srcPos && dstPos) {
                        delta.x = ( posInfo[srcNode.getId()].x - srcPos.x + posInfo[dstNode.getId()].x - dstPos.x ) / 2;
                        delta.y = ( posInfo[srcNode.getId()].y - srcPos.y + posInfo[dstNode.getId()].y - dstPos.y ) / 2;

                        linePoints.forEach(function (point) {
                            point[0] += delta.x;
                            point[1] += delta.y;

                            point[0] = point[0] > 0 ? Math.round(point[0]) : 0;
                            point[1] = point[1] > 0 ? Math.round(point[1]) : 0;
                        });

                        if (posInfo[gmeId]) {
                            // The connection is selected as a box as well - the new position must be
                            // stored under postion registry.
                            pos = posInfo[gmeId];
                        }

                        posInfo[gmeId] = {};
                        posInfo[gmeId][REGISTRY_STRING] = {};
                        posInfo[gmeId][REGISTRY_STRING][REGISTRY_KEYS.LINE_CUSTOM_POINTS] = linePoints;

                        if (pos) {
                            posInfo[gmeId][REGISTRY_STRING][REGISTRY_KEYS.POSITION] = pos;
                        }
                    }
                }
            }
        });
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDesignerItemsMove = function (repositionDesc) {
        var self = this,
            result = {};

        // Start by converting moved items to object indexed by gmeIds..
        Object.keys(repositionDesc)
            .forEach(function (itemId) {
                if (typeof self._ComponentID2GMEID[itemId] === 'string') {
                    result[self._ComponentID2GMEID[itemId]] = repositionDesc[itemId];
                }
            });

        // Add info about gme-connections that should have their segment points updated.
        this._addConnSegmentPoints(result);
        // Finally save the new positions.
        this._saveNewPositions(result);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDesignerItemsCopy = function (copyDesc) {
        var copyOpts = {parentId: this.currentNodeInfo.id},
            id,
            desc,
            gmeID;

        this.designerCanvas.beginUpdate();

        for (id in copyDesc.items) {
            if (copyDesc.items.hasOwnProperty(id)) {
                desc = copyDesc.items[id];
                gmeID = this._ComponentID2GMEID[desc.oItemId];

                copyOpts[gmeID] = {};
                copyOpts[gmeID][ATTRIBUTES_STRING] = {};
                copyOpts[gmeID][REGISTRY_STRING] = {};

                copyOpts[gmeID][REGISTRY_STRING][REGISTRY_KEYS.POSITION] = {x: desc.posX, y: desc.posY};

                //remove the component from UI
                //it will be recreated when the GME client calls back with the result
                this.designerCanvas.deleteComponent(id);
            }
        }

        for (id in copyDesc.connections) {
            if (copyDesc.connections.hasOwnProperty(id)) {
                desc = copyDesc.connections[id];
                gmeID = this._ComponentID2GMEID[desc.oConnectionId];

                copyOpts[gmeID] = {};

                //remove the component from UI
                //it will be recreated when the GME client calls back with the result
                this.designerCanvas.deleteComponent(id);
            }
        }

        this.designerCanvas.endUpdate();

        this._client.intellyPaste(copyOpts);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onCreateNewConnection = function (params) {
        var self = this,
            sourceId,
            targetId,
            parentId = this.currentNodeInfo.id,
            createConnection,
            _client = this._client,
            CONTEXT_POS_OFFSET = 10,
            menuItems = {},
            i,
            connTypeObj,
            aspect = this._selectedAspect,
            newConnID,
            validConnectionTypes,
            dstPosition;

        function getMidPosition() {
            var srcPos = self.designerCanvas.items[params.dst].getBoundingBox(),
                dstPos = self.designerCanvas.items[params.src].getBoundingBox();

            return {
                x: (srcPos.x + dstPos.x) / 2,
                y: (srcPos.y + dstPos.y) / 2
            };
        }

        //local callback to create the connection
        createConnection = function (connTypeToCreate) {
            if (connTypeToCreate) {
                _client.startTransaction();

                //create new object
                newConnID = _client.createChild({
                    parentId: parentId,
                    baseId: connTypeToCreate,
                    position: getMidPosition(),
                });

                //set source and target pointers
                _client.setPointer(newConnID, CONSTANTS.POINTER_SOURCE, sourceId);
                _client.setPointer(newConnID, CONSTANTS.POINTER_TARGET, targetId);

                _client.completeTransaction();
            }
        };

        if (params.srcSubCompId !== undefined) {
            sourceId = this._Subcomponent2GMEID[params.src][params.srcSubCompId];
        } else {
            sourceId = this._ComponentID2GMEID[params.src];
        }

        if (params.dstSubCompId !== undefined) {
            targetId = this._Subcomponent2GMEID[params.dst][params.dstSubCompId];
        } else {
            targetId = this._ComponentID2GMEID[params.dst];
        }

        //get the list of valid connection types
        validConnectionTypes = GMEConcepts.getValidConnectionTypesInAspect(sourceId, targetId, parentId, aspect);
        //filter them to see which of those can actually be created as a child of the parent
        i = validConnectionTypes.length;
        while (i--) {
            if (!GMEConcepts.canCreateChild(parentId, validConnectionTypes[i])) {
                validConnectionTypes.splice(i, 1);
            }
        }

        if (validConnectionTypes.length === 1) {
            createConnection(validConnectionTypes[0]);
        } else if (validConnectionTypes.length > 1) {
            //show available connection types to the user to select one
            for (i = 0; i < validConnectionTypes.length; i += 1) {
                connTypeObj = this._client.getNode(validConnectionTypes[i]);
                menuItems[validConnectionTypes[i]] = {
                    name: 'Create type \'' +
                    (connTypeObj ?
                        connTypeObj.getAttribute(nodePropertyNames.Attributes.name) : validConnectionTypes[i]) +
                    '\'',
                    icon: false
                };
            }

            dstPosition = this.designerCanvas.items[params.dst].getBoundingBox();

            this.designerCanvas.createMenu(menuItems, function (key) {
                    createConnection(key);
                },
                this.designerCanvas.posToPageXY(dstPosition.x - CONTEXT_POS_OFFSET,
                    dstPosition.y - CONTEXT_POS_OFFSET)
            );
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionDelete = function (idList) {
        var objIdList = [],
            i = idList.length,
            objID;

        while (i--) {
            objID = this._ComponentID2GMEID[idList[i]];
            //temporary fix to not allow deleting ROOT AND FCO
            if (GMEConcepts.canDeleteNode(objID)) {
                objIdList.pushUnique(objID);
            } else {
                this.logger.warn('Can not delete item with ID: ' + objID + '. Possibly it is the ROOT or FCO');
            }
        }

        if (objIdList.length > 0) {
            this._client.deleteNodes(objIdList);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDesignerItemDoubleClick = function (id /*, event */) {
        var gmeID = this._ComponentID2GMEID[id];

        if (gmeID) {
            this.logger.debug('Opening model with id "' + gmeID + '"');
            WebGMEGlobal.State.registerActiveObject(gmeID);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onModifyConnectionEnd = function (params) {
        var gmeID = this._ComponentID2GMEID[params.id],
            oldDesc = params.old,
            newDesc = params.new,
            newEndPointGMEID;

        if (gmeID) {
            this._client.startTransaction();

            //update connection endpoint - SOURCE
            if (oldDesc.srcObjId !== newDesc.srcObjId ||
                oldDesc.srcSubCompId !== newDesc.srcSubCompId) {
                if (newDesc.srcSubCompId !== undefined) {
                    newEndPointGMEID = this._Subcomponent2GMEID[newDesc.srcObjId][newDesc.srcSubCompId];
                } else {
                    newEndPointGMEID = this._ComponentID2GMEID[newDesc.srcObjId];
                }
                this._client.setPointer(gmeID, SRC_POINTER_NAME, newEndPointGMEID);
            }

            //update connection endpoint - TARGET
            if (oldDesc.dstObjId !== newDesc.dstObjId ||
                oldDesc.dstSubCompId !== newDesc.dstSubCompId) {
                if (newDesc.dstSubCompId !== undefined) {
                    newEndPointGMEID = this._Subcomponent2GMEID[newDesc.dstObjId][newDesc.dstSubCompId];
                } else {
                    newEndPointGMEID = this._ComponentID2GMEID[newDesc.dstObjId];
                }
                this._client.setPointer(gmeID, DST_POINTER_NAME, newEndPointGMEID);
            }

            this._client.completeTransaction();
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onRegisterSubcomponent = function (objID, sCompID,
                                                                                                       metaInfo) {
        //store that a subcomponent with a given ID has been added to object with objID
        this._GMEID2Subcomponent[metaInfo[CONSTANTS.GME_ID]] = this._GMEID2Subcomponent[metaInfo[CONSTANTS.GME_ID]] ||
            {};
        this._GMEID2Subcomponent[metaInfo[CONSTANTS.GME_ID]][objID] = sCompID;

        this._Subcomponent2GMEID[objID] = this._Subcomponent2GMEID[objID] || {};
        this._Subcomponent2GMEID[objID][sCompID] = metaInfo[CONSTANTS.GME_ID];
        //TODO: add event handling here that a subcomponent appeared
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onUnregisterSubcomponent = function (objID,
                                                                                                         sCompID) {
        var gmeID = this._Subcomponent2GMEID[objID][sCompID];

        delete this._Subcomponent2GMEID[objID][sCompID];
        if (this._GMEID2Subcomponent[gmeID]) {
            delete this._GMEID2Subcomponent[gmeID][objID];
        }
        //TODO: add event handling here that a subcomponent disappeared
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._getPossibleDropActions = function (dragInfo) {
        var items = DragHelper.getDragItems(dragInfo),
            dragEffects = DragHelper.getDragEffects(dragInfo),
            dragParams = DragHelper.getDragParams(dragInfo),
            possibleDropActions = [],
            parentID = this.currentNodeInfo.id,
            i,
            j,
            FCOamongItems = false,
            validPointerTypes = [],
            baseTypeID,
            baseTypeNode,
            dragAction,
            aspect = this._selectedAspect,
            pointerSorter = function (a, b) {
                var baseAName = a.name.toLowerCase(),
                    baseBName = b.name.toLowerCase(),
                    ptrAName = a.pointer.toLowerCase(),
                    ptrBName = b.pointer.toLowerCase();

                if (ptrAName < ptrBName) {
                    return -1;
                } else if (ptrAName > ptrBName) {
                    return 1;
                } else {
                    //ptrAName = ptrBName
                    if (baseAName < baseBName) {
                        return -1;
                    } else {
                        return 1;
                    }
                }
            };

        //check if FCO is among the items as it may change the outcome
        for (i = 0; i < items.length; i += 1) {
            if (GMEConcepts.isProjectFCO(items[i])) {
                FCOamongItems = true;
                break;
            }
        }

        //check to see what DROP actions are possible
        if (items.length > 0) {
            i = dragEffects.length;
            while (i--) {
                switch (dragEffects[i]) {
                    case DragHelper.DRAG_EFFECTS.DRAG_MOVE:
                        //check to see if dragParams.parentID and this.parentID are the same
                        //if so, it's not a real move, it is a reposition
                        if ((dragParams && dragParams.parentID === parentID) ||
                            (GMEConcepts.canCreateChildrenInAspect(parentID, items, aspect) &&
                            GMEConcepts.canMoveNodeHere(parentID, items) && !FCOamongItems)) {
                            dragAction = {dragEffect: dragEffects[i]};
                            possibleDropActions.push(dragAction);
                        }
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_COPY:
                        if (GMEConcepts.canCreateChildrenInAspect(parentID, items, aspect) && !FCOamongItems) {
                            dragAction = {dragEffect: dragEffects[i]};
                            possibleDropActions.push(dragAction);
                        }
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_CREATE_INSTANCE:
                        if (GMEConcepts.canCreateChildrenInAspect(parentID, items, aspect)) {
                            dragAction = {dragEffect: dragEffects[i]};
                            possibleDropActions.push(dragAction);
                        }
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER:
                        if (items.length === 1) {
                            validPointerTypes = GMEConcepts.getValidPointerTypes(parentID, items[0]);
                            if (validPointerTypes.length > 0) {
                                j = validPointerTypes.length;
                                //each valid pointer type is an object {'baseId': objId, 'pointer': pointerName}
                                while (j--) {
                                    baseTypeID = validPointerTypes[j].baseId;
                                    baseTypeNode = this._client.getNode(baseTypeID);
                                    validPointerTypes[j].name = baseTypeID;
                                    if (baseTypeNode) {
                                        validPointerTypes[j].name = baseTypeNode.getAttribute(
                                            nodePropertyNames.Attributes.name);
                                    }
                                }

                                validPointerTypes.sort(pointerSorter);

                                for (j = 0; j < validPointerTypes.length; j += 1) {
                                    dragAction = {
                                        dragEffect: DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER,
                                        name: validPointerTypes[j].name,
                                        baseId: validPointerTypes[j].baseId,
                                        pointer: validPointerTypes[j].pointer
                                    };
                                    possibleDropActions.push(dragAction);
                                }
                            }
                        }
                        break;
                }
            }
        }

        this.logger.debug('possibleDropActions: ' + JSON.stringify(possibleDropActions));

        return possibleDropActions;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onBackgroundDroppableAccept = function (event,
                                                                                                            dragInfo) {
        var accept;

        accept = this._getPossibleDropActions(dragInfo).length > 0;

        return accept;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onBackgroundDrop = function (event, dragInfo,
                                                                                                 position) {
        var possibleDropActions = this._getPossibleDropActions(dragInfo),
            len = possibleDropActions.length,
            i,
            selectedAction,
            self = this,
            menuItems;

        if (len === 1) {
            selectedAction = possibleDropActions[0];
            this._handleDropAction(selectedAction, dragInfo, position);
        } else {
            menuItems = {};

            for (i = 0; i < possibleDropActions.length; i += 1) {
                switch (possibleDropActions[i].dragEffect) {
                    case DragHelper.DRAG_EFFECTS.DRAG_COPY:
                        menuItems[i] = {
                            name: 'Copy here',
                            icon: 'glyphicon glyphicon-plus'
                        };
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_MOVE:
                        menuItems[i] = {
                            name: 'Move here',
                            icon: 'glyphicon glyphicon-move'
                        };
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_CREATE_INSTANCE:
                        menuItems[i] = {
                            name: 'Create instance here',
                            icon: 'glyphicon glyphicon-share-alt'
                        };
                        break;
                    case DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER:
                        menuItems[i] = {
                            name: 'Create pointer "' + possibleDropActions[i].pointer + '" of type "' +
                            possibleDropActions[i].name + '"',
                            icon: 'glyphicon glyphicon-share'
                        };
                        break;
                    default:
                        break;
                }
            }

            this.designerCanvas.createMenu(menuItems, function (key) {
                    selectedAction = possibleDropActions[parseInt(key, 10)];
                    self._handleDropAction(selectedAction, dragInfo, position);
                },
                this.designerCanvas.posToPageXY(position.x, position.y)
            );
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._handleDropAction = function (dropAction, dragInfo,
                                                                                                 position) {
        var self = this,
            dragEffect = dropAction.dragEffect,
            items = DragHelper.getDragItems(dragInfo),
            dragParams = DragHelper.getDragParams(dragInfo),
            parentID = this.currentNodeInfo.id,
            positionInfo,
            i,
            gmeID,
            params,
            POS_INC = 20,
            oldPos,
            origNode,
            ptrName;

        this.logger.debug('dropAction: ' + JSON.stringify(dropAction));
        this.logger.debug('dragInfo: ' + JSON.stringify(dragInfo));
        this.logger.debug('position: ' + JSON.stringify(position));

        function getParams() {
            var result = {parentId: parentID};
            i = items.length;

            positionInfo = self._getNewPositionFromDrag(items, dragParams && dragParams.positions, position);

            Object.keys(positionInfo).forEach(function (gmeId) {
                result[gmeId] = {};
                result[gmeId][REGISTRY_STRING] = {};
                if (positionInfo[gmeId][REGISTRY_STRING]) {
                    Object.keys(positionInfo[gmeId][REGISTRY_STRING])
                        .forEach(function (regKey) {
                            result[gmeId][REGISTRY_STRING][regKey] =
                                positionInfo[gmeId][REGISTRY_STRING][regKey];
                        });
                } else {
                    result[gmeId][REGISTRY_STRING][REGISTRY_KEYS.POSITION] = positionInfo[gmeId];
                }
            });


            while (i--) {
                // Finally make sure we copy any selected conn where the src and dst weren't there
                // and add the position of these too..
                gmeID = items[i];
                oldPos = dragParams && dragParams.positions[gmeID] || {x: 0, y: 0};
                if (!result[gmeID]) {
                    result[gmeID] = {};
                    result[gmeID][REGISTRY_STRING] = {};
                }

                if (!result[gmeID][REGISTRY_STRING][REGISTRY_KEYS.POSITION]) {
                    result[gmeID][REGISTRY_STRING][REGISTRY_KEYS.POSITION] = {
                        x: position.x + oldPos.x,
                        y: position.y + oldPos.y
                    };
                }
            }

            return result;
        }

        switch (dragEffect) {
            case DragHelper.DRAG_EFFECTS.DRAG_COPY:
                params = getParams();
                this._client.copyMoreNodes(params);
                break;
            case DragHelper.DRAG_EFFECTS.DRAG_MOVE:
                //check to see if dragParams.parentID and this.parentID are the same
                //if so, it's not a real move, it is a reposition
                if (dragParams && dragParams.parentID === parentID) {
                    //it is a reposition
                    this._saveNewPositions(
                        this._getNewPositionFromDrag(items, dragParams && dragParams.positions, position));
                } else {
                    //it is a real hierarchical move
                    params = getParams();
                    this._client.moveMoreNodes(params);
                }
                break;
            case DragHelper.DRAG_EFFECTS.DRAG_CREATE_INSTANCE:
                params = getParams();
                this._client.createChildren(params);
                break;

            case DragHelper.DRAG_EFFECTS.DRAG_CREATE_POINTER:
                params = {
                    parentId: parentID,
                    baseId: dropAction.baseId
                };

                this._client.startTransaction();

                gmeID = this._client.createChild(params);

                if (gmeID) {
                    //check if old position is in drag-params
                    oldPos = dragParams && dragParams.positions[items[0]] || {x: 0, y: 0};
                    //store new position
                    this._client.setRegistry(gmeID, REGISTRY_KEYS.POSITION, {
                        x: position.x + oldPos.x,
                        y: position.y + oldPos.y
                    });

                    //set reference
                    this._client.setPointer(gmeID, dropAction.pointer, items[0]);

                    //try to set name
                    origNode = this._client.getNode(items[0]);
                    if (origNode) {
                        ptrName = origNode.getAttribute(nodePropertyNames.Attributes.name) + '-' +
                            dropAction.pointer;
                        this._client.setAttribute(gmeID, nodePropertyNames.Attributes.name, ptrName);
                    }
                }

                this._client.completeTransaction();

                break;
            default:
                break;
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._getNewPositionFromDrag = function (items,
                                                                                                       dragPositions,
                                                                                                       dropPosition) {
        var result = {}; // {<gmeId>: {x: <int>, y <int>}

        items.forEach(function (id) {
            var relPos = dragPositions && dragPositions[id],
                newPos = {x: dropPosition.x, y: dropPosition.y};

            if (relPos) {
                newPos.x += relPos.x;
                newPos.y += relPos.y;
                newPos.x = newPos.x > 0 ? Math.round(newPos.x) : 0;
                newPos.y = newPos.y > 0 ? Math.round(newPos.y) : 0;

                result[id] = newPos;
            }
        });

        this._addConnSegmentPoints(result);

        return result;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionChanged = function (selectedIds) {
        var self = this,
            gmeIDs = [],
            extraIds = [],
            enableEditConnections = selectedIds.length > 0;

        selectedIds.forEach(function (id) {
            var gmeId = self._ComponentID2GMEID[id];

            if (gmeId) {
                if (gmeIDs.indexOf(gmeId) === -1) {
                    gmeIDs.push(gmeId);
                }

                // Make sure any connection boxes are selected when selecting a connection edge
                // (and the other way around too).
                if (self._GMEID2ComponentID[gmeId] && self._GMEID2ComponentID[gmeId].length > 1) {
                    self._GMEID2ComponentID[gmeId].forEach(function (cId) {
                        if (selectedIds.indexOf(cId) === -1 && extraIds.indexOf(cId) === -1) {
                            extraIds.push(cId);
                        }
                    });
                }

                enableEditConnections = enableEditConnections && GMEConcepts.isConnectionType(gmeId);
            }
        });

        enableEditConnections = enableEditConnections && this.designerCanvas.getIsReadOnlyMode() === false;

        this.designerCanvas.toolbarItems.ddbtnConnectionArrowStart.enabled(enableEditConnections);
        this.designerCanvas.toolbarItems.ddbtnConnectionPattern.enabled(enableEditConnections);
        this.designerCanvas.toolbarItems.ddbtnConnectionArrowEnd.enabled(enableEditConnections);
        this.designerCanvas.toolbarItems.ddbtnConnectionLineType.enabled(enableEditConnections);
        this.designerCanvas.toolbarItems.ddbtnConnectionLineWidth.enabled(enableEditConnections);
        this.designerCanvas.toolbarItems.ddbtnConnectionLabelPlacement.enabled(enableEditConnections);

        this.$btnConnectionRemoveSegmentPoints.enabled(enableEditConnections);

        if (extraIds.length > 0) {
            if (selectedIds.length === 1 &&
                enableEditConnections &&
                WebGMEGlobal.State.getActiveSelection().length === 1 &&
                WebGMEGlobal.State.getActiveSelection()[0] === gmeIDs[0]) {
                // Same connection selected again -> will not add box to selection
                // needed for seg points and reverse makes moving conn-boxes nicer.
            } else {
                this.designerCanvas.select(selectedIds.concat(extraIds));
            }
        } else {
            WebGMEGlobal.State.registerActiveSelection(gmeIDs, {invoker: this});
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onClipboardCopy = function (selectedIds) {
        var gmeIDs = [],
            len = selectedIds.length,
            id;

        while (len--) {
            id = this._ComponentID2GMEID[selectedIds[len]];
            if (id) {
                gmeIDs.push(id);
            }
        }

        if (gmeIDs.length !== 0) {
            this._client.copyNodes(gmeIDs);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onClipboardPaste = function () {
        if (this.currentNodeInfo.id) {
            this._client.pasteNodes(this.currentNodeInfo.id);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onConnectionSegmentPointsChange = function (params) {
        var connID = params.connectionID,
            points = params.points,
            gmeID = this._ComponentID2GMEID[connID],
            nodeObj;

        if (gmeID) {
            nodeObj = this._client.getNode(gmeID);
            if (nodeObj) {
                this._client.setRegistry(gmeID, REGISTRY_KEYS.LINE_CUSTOM_POINTS, points);
            }
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onFilterNewConnectionDroppableEnds = function (params) {
        var availableConnectionEnds = params.availableConnectionEnds,
            result = [],
            i,
            sourceId,
            targetId,
            validConnectionTypes,
            j,
            parentID = this.currentNodeInfo.id,
            aspect = this._selectedAspect,
            targetNode,
            p;

        if (params.srcSubCompId === undefined) {
            sourceId = this._ComponentID2GMEID[params.srcId];
        } else {
            sourceId = this._Subcomponent2GMEID[params.srcId][params.srcSubCompId];
        }

        //need to test for each source-destination pair if the connection can be made or not?
        //there is at least one valid connection type definition in the parent
        //  that could be created between the source and target
        //there is at least one valid connection type that really can be created in the parent (max chilren num...)
        validConnectionTypes = GMEConcepts.getValidConnectionTypesFromSourceInAspect(sourceId, parentID, aspect);

        //filter them to see which of those can actually be created as a child of the parent
        i = validConnectionTypes.length;
        while (i--) {
            if (!GMEConcepts.canCreateChild(parentID, validConnectionTypes[i])) {
                validConnectionTypes.splice(i, 1);
            }
        }

        i = availableConnectionEnds.length;
        while (i--) {
            p = availableConnectionEnds[i];
            if (p.dstSubCompID === undefined) {
                targetId = this._ComponentID2GMEID[p.dstItemID];
            } else {
                targetId = this._Subcomponent2GMEID[p.dstItemID][p.dstSubCompID];
            }

            j = validConnectionTypes.length;
            targetNode = this._client.getNode(targetId);
            while (j--) {
                if (targetNode && targetNode.isValidTargetOf(validConnectionTypes[j], CONSTANTS.POINTER_TARGET)) {
                    result.push(availableConnectionEnds[i]);
                    break;
                }
            }
        }

        return result;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onFilterReconnectionDroppableEnds = function (params) {
        var connID = params.connId,
            srcDragged = params.draggedEnd === DiagramDesignerWidgetConstants.CONNECTION_END_SRC,
            srcItemID = params.srcItemID,
            srcSubCompID = params.srcSubCompID,
            dstItemID = params.dstItemID,
            dstSubCompID = params.dstSubCompID,
            availableConnectionEnds = params.availableConnectionEnds,
            availableConnectionSources = params.availableConnectionSources,
            i,
            result = [],
            newEndPointGMEID,
            oldEndPointGMEID,
            connectionGMEID = this._ComponentID2GMEID[connID];

        if (srcDragged === true) {
            //'src' end of the connection is being dragged
            //'dst end is fix
            if (dstSubCompID !== undefined) {
                oldEndPointGMEID = this._Subcomponent2GMEID[dstItemID][dstSubCompID];
            } else {
                oldEndPointGMEID = this._ComponentID2GMEID[dstItemID];
            }
            //need to check for all possible 'src' if the connection's end could be changed to that value
            i = availableConnectionSources.length;
            while (i--) {
                srcItemID = availableConnectionSources[i].srcItemID;
                srcSubCompID = availableConnectionSources[i].srcSubCompID;
                if (srcSubCompID !== undefined) {
                    newEndPointGMEID = this._Subcomponent2GMEID[srcItemID][srcSubCompID];
                } else {
                    newEndPointGMEID = this._ComponentID2GMEID[srcItemID];
                }

                if (GMEConcepts.isValidConnection(newEndPointGMEID, oldEndPointGMEID, connectionGMEID) === true) {
                    result.push(availableConnectionSources[i]);
                }
            }
        } else {
            //'dst' end of the connection is being dragged
            //'src end is fix
            if (srcSubCompID !== undefined) {
                oldEndPointGMEID = this._Subcomponent2GMEID[srcItemID][srcSubCompID];
            } else {
                oldEndPointGMEID = this._ComponentID2GMEID[srcItemID];
            }
            //need to check for all possible 'dst' if the connection's end could be changed to that value
            i = availableConnectionEnds.length;
            while (i--) {
                dstItemID = availableConnectionEnds[i].dstItemID;
                dstSubCompID = availableConnectionEnds[i].dstSubCompID;
                if (dstSubCompID !== undefined) {
                    newEndPointGMEID = this._Subcomponent2GMEID[dstItemID][dstSubCompID];
                } else {
                    newEndPointGMEID = this._ComponentID2GMEID[dstItemID];
                }
                if (GMEConcepts.isValidConnection(oldEndPointGMEID, newEndPointGMEID, connectionGMEID) === true) {
                    result.push(availableConnectionEnds[i]);
                }
            }
        }

        return result;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDragStartDesignerItemDraggable = function (/*itemID*/) {
        var result = true;

        return result;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDragStartDesignerItemCopyable = function (itemID) {
        var nodeObj = this._client.getNode(this._ComponentID2GMEID[itemID]),
            result = true;

        if (nodeObj) {
            result = nodeObj.getAttribute('copy') !== 'false';
        }

        return result;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onDragStartDesignerConnectionCopyable = function (connectionID) {
        return this._onDragStartDesignerItemCopyable(connectionID);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionRotated = function (degree,
                                                                                                   selectedIds) {
        var i = selectedIds.length,
            regDegree,
            newDegree,
            ownDegree,
            node,
            setNewValue = true,
            transaction = false,
            gmeID;

        while (i--) {
            gmeID = this._ComponentID2GMEID[selectedIds[i]];
            node = this._client.getNode(gmeID);
            if (node) {
                regDegree = node.getRegistry(REGISTRY_KEYS.ROTATION) || 0;
                ownDegree = node.getOwnRegistry(REGISTRY_KEYS.ROTATION);

                if (degree === DiagramDesignerWidgetConstants.ROTATION_RESET) {
                    newDegree = 0;
                } else if (degree === DiagramDesignerWidgetConstants.ROTATION_TOLEFT) {
                    newDegree = regDegree - (regDegree % 90);
                } else if (degree === DiagramDesignerWidgetConstants.ROTATION_TORIGHT) {
                    newDegree = regDegree % 90 > 0 ? regDegree + 90 - (regDegree % 90) : regDegree;
                } else if (degree === DiagramDesignerWidgetConstants.ROTATION_CLEAR) {
                    setNewValue = false;
                } else {
                    newDegree = (regDegree + degree) % 360;
                }

                if (setNewValue && newDegree !== ownDegree) {
                    if (!transaction) {
                        transaction = true;
                        this._client.startTransaction();
                    }
                    this._client.setRegistry(gmeID, REGISTRY_KEYS.ROTATION, newDegree);
                } else if (!setNewValue && ownDegree !== undefined) {
                    if (!transaction) {
                        transaction = true;
                        this._client.startTransaction();
                    }
                    this._client.delRegistry(gmeID, REGISTRY_KEYS.ROTATION);
                }
            }

        }

        if (transaction) {
            this._client.completeTransaction();
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSetConnectionProperty = function (params) {
        var items = params.items,
            visualParams = params.params,
            gmeIDs = [],
            len = items.length,
            id,
            setObjRegistry,
            client = this._client;

        setObjRegistry = function (objID, paramKey, registryKey) {
            if (visualParams.hasOwnProperty(paramKey)) {
                client.setRegistry(objID, registryKey, visualParams[paramKey]);
            }
        };

        while (len--) {
            id = this._ComponentID2GMEID[items[len]];
            if (id) {
                gmeIDs.push(id);
            }
        }

        len = gmeIDs.length;
        if (len > 0) {
            this._client.startTransaction();

            while (len--) {
                id = gmeIDs[len];
                //set visual properties
                setObjRegistry(id, CONSTANTS.LINE_STYLE.START_ARROW, REGISTRY_KEYS.LINE_START_ARROW);
                setObjRegistry(id, CONSTANTS.LINE_STYLE.END_ARROW, REGISTRY_KEYS.LINE_END_ARROW);
                setObjRegistry(id, CONSTANTS.LINE_STYLE.TYPE, REGISTRY_KEYS.LINE_TYPE);
                setObjRegistry(id, CONSTANTS.LINE_STYLE.PATTERN, REGISTRY_KEYS.LINE_STYLE);
                setObjRegistry(id, CONSTANTS.LINE_STYLE.WIDTH, REGISTRY_KEYS.LINE_WIDTH);
                setObjRegistry(id, CONSTANTS.LINE_STYLE.LABEL_PLACEMENT, REGISTRY_KEYS.LINE_LABEL_PLACEMENT);
            }

            this._client.completeTransaction();
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onCopy = function () {
        var res = [],
            selectedIDs = this.designerCanvas.selectionManager.getSelectedElements(),
            i = selectedIDs.length,
            gmeID,
            obj,
            nodeObj,
            cpData = {
                project: this._client.getActiveProjectId(),
                items: []
            };

        while (i--) {
            gmeID = this._ComponentID2GMEID[selectedIDs[i]];
            obj = {
                ID: gmeID,
                Name: undefined,
                Position: undefined
            };

            nodeObj = this._client.getNode(gmeID);
            if (nodeObj) {
                obj.Name = nodeObj.getAttribute(nodePropertyNames.Attributes.name);
                obj.Position = nodeObj.getRegistry(REGISTRY_KEYS.POSITION);
            }

            res.push(obj);
        }

        cpData.items = res;

        return cpData;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onPaste = function (data) {
        var len,
            objDesc,
            parentID = this.currentNodeInfo.id,
            params = {parentId: parentID},
            projectName = this._client.getActiveProjectId(),
            childrenIDs = [],
            aspect = this._selectedAspect;

        if (parentID) {
            try {
                data = JSON.parse(data);
            } catch (e) {
                this.logger.error('Invalid clipboard data: "' + data + '"');
                data = undefined;
            }

            if (data && data.project && data.items) {
                if (projectName !== data.project) {
                    alert('Trying to copy from project \'' + data.project + '\' to project \'' + projectName +
                        '\' which is not supported... Copy&Paste is supported in the same project only.');
                } else {
                    if (_.isArray(data.items)) {
                        data = data.items;
                        len = data.length;

                        while (len--) {
                            objDesc = data[len];

                            if (objDesc && objDesc.ID) {
                                params[objDesc.ID] = {};
                                childrenIDs.push(objDesc.ID);
                            }
                        }

                        if (GMEConcepts.canCreateChildrenInAspect(parentID, childrenIDs, aspect)) {
                            this._client.startTransaction();
                            this._client.copyMoreNodes(params);
                            this._client.completeTransaction();
                            this.logger.warn('Pasted ' + childrenIDs.length + ' items successfully into node (' +
                                parentID + ')');
                        } else {
                            this.logger.warn('Can not paste items because not all the items on the clipboard can be ' +
                                'created as a child of the currently opened node (' + parentID + ')');
                        }
                    }
                }
            }
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._getDragItems = function (selectedElements) {
        var res = [],
            i = selectedElements.length;

        while (i--) {
            res.push(this._ComponentID2GMEID[selectedElements[i]]);
        }

        return res;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._getDragParams = function (selectedElements, event) {
        var oParams = this._oGetDragParams.call(this.designerCanvas, selectedElements, event),
            params = {
                positions: {},
                parentID: this.currentNodeInfo.id
            },
            i;

        for (i in oParams.positions) {
            if (oParams.positions.hasOwnProperty(i)) {
                params.positions[this._ComponentID2GMEID[i]] = oParams.positions[i];
            }
        }

        return params;
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionContextMenu = function (selectedIds,
                                                                                                       mousePos) {
        var menuItems = {},
            MENU_CONSTRAINTS_NODE = 'connode',
            MENU_CONSTRAINTS_MODEL = 'conmodel',
            MENU_META_RULES_NODE = 'metaRulesNode',
            MENU_META_RULES_MODEL = 'metaRulesModel',
            MENU_EDIT_REPLACEABLE = 'editReplaceable',
            MENU_EXPORT_MODELS = 'exportModels',
            MENU_IMPORT_MODELS = 'importModels',
            node,
            i,
            paths,
            libraryContentSelected = false,
            self = this;

        if (selectedIds.length === 1) {
            menuItems[UI_EVENTS.LOCATE_NODE] = {
                name: 'Locate in tree browser',
                doNotHide: true,
                icon: 'glyphicon glyphicon-screenshot'
            };

            if (GMEConcepts.isReplaceable(self._ComponentID2GMEID[selectedIds[0]])) {
                menuItems[MENU_EDIT_REPLACEABLE] = {
                    name: 'Replace base ...',
                    icon: 'glyphicon glyphicon-transfer'
                };
            }

            menuItems[MENU_META_RULES_NODE] = {
                name: 'Check Meta rules for node',
                icon: 'glyphicon glyphicon-ok-sign'
            };
            menuItems[MENU_META_RULES_MODEL] = {
                name: 'Check Meta rules for node and its children',
                icon: 'glyphicon glyphicon-ok-sign'
            };
            if (self._client.gmeConfig.core.enableCustomConstraints === true) {
                menuItems[MENU_CONSTRAINTS_NODE] = {
                    name: 'Check Custom Constraints for node',
                    icon: 'glyphicon glyphicon-fire'
                };
                menuItems[MENU_CONSTRAINTS_MODEL] = {
                    name: 'Check Custom Constraints for node and its children',
                    icon: 'glyphicon glyphicon-fire'
                };
            }

            node = self._client.getNode(self._ComponentID2GMEID[selectedIds[0]]);

            if (node.isLibraryElement() === false && node.isLibraryRoot() === false) {
                menuItems[MENU_EXPORT_MODELS] = {
                    name: 'Export selected model',
                    icon: 'glyphicon glyphicon-export'
                };
                menuItems[MENU_IMPORT_MODELS] = {
                    name: 'Import models into',
                    icon: 'glyphicon glyphicon-import'
                };
            }

        } else if (selectedIds.length > 1) {
            menuItems[MENU_META_RULES_NODE] = {
                name: 'Check Meta rules for nodes',
                icon: 'glyphicon glyphicon-ok-sign'
            };
            menuItems[MENU_META_RULES_MODEL] = {
                name: 'Check Meta rules for nodes and their children',
                icon: 'glyphicon glyphicon-ok-sign'
            };
            if (self._client.gmeConfig.core.enableCustomConstraints === true) {
                menuItems[MENU_CONSTRAINTS_NODE] = {
                    name: 'Check Custom Constraints for nodes',
                    icon: 'glyphicon glyphicon-fire'
                };
                menuItems[MENU_CONSTRAINTS_MODEL] = {
                    name: 'Check Custom Constraints for nodes and their children',
                    icon: 'glyphicon glyphicon-fire'
                };
            }

            for (i = 0; i < selectedIds.length; i += 1) {
                node = self._client.getNode(self._ComponentID2GMEID[selectedIds[i]]);
                if (node.isLibraryElement() || node.isLibraryRoot()) {
                    libraryContentSelected = true;
                    break;
                }
            }

            if (libraryContentSelected === false) {
                menuItems[MENU_EXPORT_MODELS] = {
                    name: 'Export selected models',
                    icon: 'glyphicon glyphicon-export'
                };
            }
        }

        this.designerCanvas.createMenu(menuItems, function (key) {
                if (key === MENU_CONSTRAINTS_NODE) {
                    self._nodeConCheck(selectedIds, false);
                } else if (key === MENU_CONSTRAINTS_MODEL) {
                    self._nodeConCheck(selectedIds, true);
                } else if (key === MENU_META_RULES_NODE) {
                    self._metaRulesCheck(selectedIds, false);
                } else if (key === MENU_META_RULES_MODEL) {
                    self._metaRulesCheck(selectedIds, true);
                } else if (key === UI_EVENTS.LOCATE_NODE) {
                    self._client.dispatchEvent(UI_EVENTS.LOCATE_NODE, {
                        nodeId: self._ComponentID2GMEID[selectedIds[0]]
                    });
                } else if (key === MENU_EDIT_REPLACEABLE) {
                    self._replaceBaseDialog(self._ComponentID2GMEID[selectedIds[0]]);
                } else if (key === MENU_EXPORT_MODELS) {
                    paths = [];
                    for (i = 0; i < selectedIds.length; i += 1) {
                        paths.push(self._ComponentID2GMEID[selectedIds[i]]);
                    }

                    exporters.exportModels(self._client, self.logger, paths);
                } else if (key === MENU_IMPORT_MODELS) {
                    var importDialog = new ImportModelDialog(self._client, self.logger.fork('ImportModel'));
                    importDialog.show(self._ComponentID2GMEID[selectedIds[0]]);
                }
            },
            this.designerCanvas.posToPageXY(mousePos.mX,
                mousePos.mY)
        );
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._replaceBaseDialog = function (selectedId) {
        var dialog;
        if (typeof selectedId === 'string' && this._client.getNode(selectedId)) {
            dialog = new ReplaceBaseDialog();
            dialog.show({client: this._client, nodeId: selectedId});
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionAlignMenu = function (selectedIds,
                                                                                                     mousePos) {
        var menuPos = this.designerCanvas.posToPageXY(mousePos.mX, mousePos.mY),
            self = this,
            itemsIds = selectedIds.filter(function (itemId) {
                return self.designerCanvas.itemIds.indexOf(itemId) > -1;
            });

        this._alignMenu.show(itemsIds, menuPos, function (key) {
            self._onAlignSelection(itemsIds, key);
        });
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._metaRulesCheck = function (selectedIds,
                                                                                               includeChildren) {
        var i = selectedIds.length,
            gmeIDs = [];

        while (i--) {
            gmeIDs.push(this._ComponentID2GMEID[selectedIds[i]]);
        }

        if (gmeIDs.length > 0) {
            this._client.checkMetaRules(gmeIDs, includeChildren);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._nodeConCheck = function (selectedIds,
                                                                                             includeChildren) {
        var i = selectedIds.length,
            gmeIDs = [];

        while (i--) {
            gmeIDs.push(this._ComponentID2GMEID[selectedIds[i]]);
        }

        if (gmeIDs.length > 0) {
            this._client.checkCustomConstraints(gmeIDs, includeChildren);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionFillColorChanged = function (selectedElements,
                                                                                                            color) {
        this._onSelectionSetColor(selectedElements, color, REGISTRY_KEYS.COLOR);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionBorderColorChanged = function (selectedElements,
                                                                                                              color) {
        this._onSelectionSetColor(selectedElements, color, REGISTRY_KEYS.BORDER_COLOR);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionTextColorChanged = function (selectedElements,
                                                                                                            color) {
        this._onSelectionSetColor(selectedElements, color, REGISTRY_KEYS.TEXT_COLOR);
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectionSetColor = function (selectedIds, color,
                                                                                                    regKey) {
        var i = selectedIds.length,
            gmeID;

        this._client.startTransaction();
        while (i--) {
            gmeID = this._ComponentID2GMEID[selectedIds[i]];

            if (color) {
                this._client.setRegistry(gmeID, regKey, color);
            } else {
                this._client.delRegistry(gmeID, regKey);
            }
        }
        this._client.completeTransaction();
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onSelectedTabChanged = function (tabID) {
        if (this._aspects[tabID] && this._selectedAspect !== this._aspects[tabID]) {
            this._selectedAspect = this._aspects[tabID];

            this.logger.debug('selectedAspectChanged: ' + this._selectedAspect);

            this._initializeSelectedAspect(tabID);
        }
    };

    ModelEditorControlDiagramDesignerWidgetEventHandlers.prototype._onAlignSelection = function (selectedIds, type) {
        var self = this,
            selectedModels,
            allModels,
            result;

        function getItemData(itemId) {
            var item = self.designerCanvas.items[itemId];

            return {
                id: itemId,
                x: item.positionX,
                y: item.positionY,
                width: item._width,
                height: item._height
            };
        }

        function isItemId(itemId) {
            return self.designerCanvas.itemIds.indexOf(itemId) > -1;
        }

        selectedModels = selectedIds.filter(isItemId).map(getItemData);

        if (selectedModels.length === 0) {
            // No models were selected...
            return;
        }

        allModels = self.designerCanvas.itemIds.map(getItemData);

        result = this._alignMenu.getNewPositions(allModels, selectedModels, type);
        self._onDesignerItemsMove(result);
    };

    return ModelEditorControlDiagramDesignerWidgetEventHandlers;
});
