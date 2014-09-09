/*
 ---

 name: Triggers

 description: Generates trigger objects for the different trigger types.

 provides: [Triggers]

 ---
 */

(function () {
    "use strict";

    var Triggers = {};

    Triggers.TriggerType = Object.freeze({
        Unknown: 'Unknown',
        Mouse: 'Mouse',
        Text: 'Text',
        Keyboard: 'Keyboard'
    });

    Triggers.MouseAction = Object.freeze({
        None: 'None',
        Click: 'Click',
        RightClick: 'RightClick',
        DoubleClick: 'DoubleClick',
        Move: 'Move',
        Down: 'Down',
        Up: 'Up'
    });

    Triggers.createMouseTrigger = function (mouseAction, control, location) {
        var mouseTrigger = {
            triggerType: Triggers.TriggerType.Mouse,
            location: location,
            mouseAction: mouseAction,
            control: control
        };

        mouseTrigger.toString = function () {
            return mouseAction + ' [' + JSON.stringify(control) + '] ' + JSON.stringify(location);
        };

        return mouseTrigger;
    };

    Triggers.createTextTrigger = function (control, text) {
        var textTrigger = {
            triggerType: Triggers.TriggerType.Text,
            control: control,
            text: text
        };

        textTrigger.toString = function () {
            return "Text [" + JSON.stringify(control) + "] '" + text + "'";
        };

        return textTrigger;
    };

    module.exports = Triggers;
}());