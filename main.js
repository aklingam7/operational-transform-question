var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// Replace isValid with validate and throw errors or return a string instead of returning false to provide more information
function isValid(stale, latest, transform) {
    // Initializing variables and constants
    var audFileExts = ["mp3", "wav"];
    var imgFileExts = ["jpeg", "jpg", "png"];
    var vidFileExts = ["mp4", "mov"];
    var staleFileGroups = [["audio", stale.audio], ["image", stale.image], ["other", stale.other], ["video", stale.video]];
    var latestFileGroups = [["audio", latest.audio], ["image", latest.image], ["other", latest.other], ["video", latest.video]];
    var internalLatest = stale;
    // Checking if the stale and latest parameters are valid
    for (var _i = 0, _a = ["checking stale", "checking latest"]; _i < _a.length; _i++) {
        var checkState = _a[_i];
        for (var _b = 0, _c = (checkState == "checking stale" ? staleFileGroups : latestFileGroups); _b < _c.length; _b++) {
            var fileGroup = _c[_b];
            if (typeof fileGroup[1] != "undefined") {
                for (var _d = 0, _e = fileGroup[1]; _d < _e.length; _d++) {
                    var file = _e[_d];
                    var extension = file.file.slice(file.file.lastIndexOf(".") + 1);
                    switch (fileGroup[0]) {
                        case 'audio':
                            if (!(audFileExts.includes(extension) && file.customType == "audio")) {
                                return false;
                            } // Maybe throw an exception insted of return to avoid confusion?
                            break;
                        case 'image':
                            if (!(imgFileExts.includes(extension) && file.customType == "image")) {
                                return false;
                            }
                            break;
                        case 'other':
                            if (__spreadArrays(audFileExts, imgFileExts, vidFileExts).includes(extension) || !(file.customType == "other")) {
                                return false;
                            }
                            break;
                        case 'video':
                            if (!(vidFileExts.includes(extension) && file.customType == "video")) {
                                return false;
                            }
                            break;
                    }
                }
            }
        }
    }
    // Checking if all the transformations are valid and performing the changes to an internal copy of latest
    for (var _f = 0, transform_1 = transform; _f < transform_1.length; _f++) {
        var transformation = transform_1[_f];
        var internalFileGroup = [];
        var editInternalFileGroup = function () { };
        switch (transformation.type.toString()) {
            case 'audio':
                internalFileGroup = [internalLatest.audio, audFileExts];
                editInternalFileGroup = function (files) { internalLatest.audio = files; };
                break;
            case 'image':
                internalFileGroup = [internalLatest.image, imgFileExts];
                editInternalFileGroup = function (files) { internalLatest.image = files; };
                break;
            case 'other':
                internalFileGroup = [internalLatest.other, ["other"]];
                editInternalFileGroup = function (files) { internalLatest.other = files; };
                break;
            case 'video':
                internalFileGroup = [internalLatest.video, vidFileExts];
                editInternalFileGroup = function (files) { internalLatest.video = files; };
                break;
        }
        switch (transformation.state.toString()) {
            case 'Move':
                if (typeof transformation.position == "undefined" || typeof transformation.secondPosition == "undefined" || typeof transformation.fileObj != "undefined") {
                    return false;
                } // Again, throw exception? 
                if (typeof internalFileGroup[0] == "undefined") {
                    return false;
                }
                if (internalFileGroup[0].length - 1 < Math.max(transformation.position, transformation.secondPosition)) {
                    return false;
                }
                var finishedMGroup = internalFileGroup[0];
                var fileToMove = internalFileGroup[0][transformation.position];
                var fileAtDestination = internalFileGroup[0][transformation.secondPosition];
                finishedMGroup[transformation.secondPosition] = fileToMove;
                finishedMGroup[transformation.position] = fileAtDestination;
                editInternalFileGroup(finishedMGroup);
                break;
            case 'Insert':
                if (typeof transformation.position != "undefined" || typeof transformation.secondPosition != "undefined" || typeof transformation.fileObj == "undefined") {
                    return false;
                } // Again, throw exception?
                var extension = transformation.fileObj.file.slice(transformation.fileObj.file.lastIndexOf(".") + 1);
                if (internalFileGroup[1][0] == "other") {
                    if (__spreadArrays(audFileExts, imgFileExts, vidFileExts).includes(extension)) {
                        return false;
                    }
                }
                else {
                    if (!internalFileGroup[1].includes(extension)) {
                        return false;
                    }
                }
                if (transformation.fileObj.customType != transformation.type) {
                    return false;
                }
                var finishedIGroup = internalFileGroup[0];
                if (typeof finishedIGroup != "undefined") {
                    finishedIGroup.push(transformation.fileObj);
                }
                else {
                    finishedIGroup = [transformation.fileObj];
                }
                editInternalFileGroup(finishedIGroup);
                break;
            case 'Delete':
                if (typeof transformation.position == "undefined" || typeof transformation.secondPosition != "undefined" || typeof transformation.fileObj != "undefined") {
                    return false;
                } // Again, throw exception?
                if (typeof internalFileGroup[0] == "undefined") {
                    return false;
                }
                if (internalFileGroup[0].length - 1 < transformation.position) {
                    return false;
                }
                var finishedDGroup = internalFileGroup[0];
                finishedDGroup.splice(transformation.position, 1);
                editInternalFileGroup(finishedDGroup);
                break;
        }
    }
    // Checking if the internal copy of latest matches the provided latest
    var assert = require("assert");
    try {
        assert.deepEqual(internalLatest, latest);
    }
    catch (error) {
        if (error.name === "AssertionError") {
            return false;
        }
        throw error;
    }
    return true;
}
var adityaTestTransform1 = isValid({
    video: [
        { file: '1.mp4', customType: 'video' },
        { file: '2.mp4', customType: 'video' },
        { file: '3.mp4', customType: 'video' }
    ],
    other: [
        { file: "5png", customType: "other" }
    ]
}, {
    video: [
        { file: '3.mp4', customType: 'video' },
        { file: '2.mp4', customType: 'video' }
    ],
    image: [
        { file: '1.png', customType: 'image' },
        { file: 'gs.png', customType: 'image' },
    ],
    other: [
        { file: "5png", customType: "other" },
        { file: "6png", customType: "other" }
    ]
}, [
    { state: 'Move', position: 0, secondPosition: 2, type: 'video' },
    {
        state: 'Insert',
        fileObj: { file: '1.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Delete',
        position: 2,
        type: 'video'
    },
    {
        state: 'Insert',
        fileObj: { file: '6png', customType: 'other' },
        type: 'other'
    },
    {
        state: 'Insert',
        fileObj: { file: 'gs.png', customType: 'image' },
        type: 'image'
    },
]);
var rahulExTransform1 = isValid({
    video: [
        { file: '1.mp4', customType: 'video' },
        { file: '2.mp4', customType: 'video' },
        { file: '3.mp4', customType: 'video' }
    ]
}, {
    video: [
        { file: '2.mp4', customType: 'video' },
        { file: '1.mp4', customType: 'video' }
    ],
    image: [{ file: '1.png', customType: 'image' }]
}, [
    { state: 'Move', position: 0, secondPosition: 2, type: 'video' },
    {
        state: 'Insert',
        fileObj: { file: '1.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Delete',
        position: 0,
        type: 'video'
    }
]); // true
var rahulExTransform2 = isValid({}, {
    video: [
        { file: '1.mov', customType: 'video' },
        { file: '2.mov', customType: 'video' }
    ],
    image: [
        { file: '1.png', customType: 'image' },
        { file: '2.png', customType: 'image' },
        { file: '3.png', customType: 'image' }
    ]
}, [
    {
        state: 'Insert',
        fileObj: { file: '1.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Insert',
        fileObj: { file: '1.mp3', customType: 'audio' },
        type: 'audio'
    },
    {
        state: 'Insert',
        fileObj: { file: '1.mov', customType: 'video' },
        type: 'video'
    },
    {
        state: 'Delete',
        position: 0,
        type: 'video'
    },
    {
        state: 'Insert',
        fileObj: { file: '2.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Insert',
        fileObj: { file: '3.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Insert',
        fileObj: { file: '2.mov', customType: 'video' },
        type: 'video'
    },
    {
        state: 'Move',
        position: 2,
        secondPosition: 1,
        type: 'video'
    }
]); // false
/***
 * Three reasons why
 * Audio not there
 * Video not deleted
 * Images not moved
 */
var rahulExTransform3 = isValid({
    video: [
        { file: '1.mp4', customType: 'video' },
        { file: '2.mp4', customType: 'video' },
        { file: '3.mp4', customType: 'video' }
    ],
    image: [{ file: '1.png', customType: 'image' }]
}, {
    video: [
        { file: '3.mp4', customType: 'video' },
        { file: '1.mp4', customType: 'video' }
    ],
    image: [
        { file: '1.png', customType: 'image' },
        { file: '2.png', customType: 'image' }
    ]
}, [
    { state: 'Move', position: 0, secondPosition: 2, type: 'video' },
    {
        state: 'Insert',
        fileObj: { file: '2.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Delete',
        position: 1,
        type: 'video'
    },
    {
        state: 'Insert',
        fileObj: { file: '3.png', customType: 'image' },
        type: 'image'
    },
    {
        state: 'Delete',
        position: 1,
        type: 'image'
    }
]); // false, wrong image deletion
console.log(adityaTestTransform1);
console.log(rahulExTransform1, rahulExTransform2, rahulExTransform3);
