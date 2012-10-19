"use strict";

define([
    'PropertyEditor/Widgets/WidgetBase',
    'clientUtil'
],
    function (WidgetBase,
              clientUtil) {

        var BooleanWidget;

        BooleanWidget  = function (propertyDesc) {
            var self = this;

            BooleanWidget.superclass.call(this, propertyDesc);

            this.__checkbox = $('<input/>', {
                "type": "checkbox",
                "checked": this.propertyValue
            });

            this.__checkbox.on('change', function (e) {
                self.setValue($(this).is(':checked'));
                self.fireFinishChange();
            });

            this.updateDisplay();

            this.el.append(this.__checkbox);
        };

        BooleanWidget.superclass = WidgetBase;

        clientUtil.extend(
            BooleanWidget.prototype,
            WidgetBase.prototype
        );

        BooleanWidget.prototype.updateDisplay =  function () {

            if (this.getValue() === true) {
                this.__checkbox.attr('checked', true);
            } else {
                this.__checkbox.attr('checked', false);
            }

            return BooleanWidget.superclass.prototype.updateDisplay.call(this);
        };

        return BooleanWidget;

    });