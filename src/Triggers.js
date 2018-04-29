(function () {
    'use strict';

    /**
     * Generates trigger objects for the different trigger types.
     */
    var Triggers = {};

    Triggers.TriggerType = {
        Unknown: 'Unknown',
        Mouse: 'Mouse',
        Text: 'Text',
        Keyboard: 'Keyboard'
    };
    Object.freeze(Triggers.TriggerType);

    Triggers.MouseAction = {
        None: 'None',
        Click: 'Click',
        RightClick: 'RightClick',
        DoubleClick: 'DoubleClick',
        Move: 'Move',
        Down: 'Down',
        Up: 'Up'
    };
    Object.freeze(Triggers.MouseAction);

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

    exports.Triggers = Triggers;
}());
