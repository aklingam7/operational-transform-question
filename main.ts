type FileTypes = 'video' | 'audio' | 'image' | 'other'

type FileWithMetadata = {
  file: string // Replaced file with string to make it easier
  customType: FileTypes
  // ... Extra stuff
}

type InputFilesType = {
  video?: FileWithMetadata[]
  audio?: FileWithMetadata[]
  image?: FileWithMetadata[]
  other?: FileWithMetadata[]
}

type FileTransformType = {
  state: 'Move' | 'Insert' | 'Delete'
  position?: number // Position A
  fileObj?: FileWithMetadata
  type: FileTypes
  secondPosition?: number // Position B
}

// Replace isValid with validate and throw errors or return a string instead of returning false to provide more information
function isValid(
  stale: InputFilesType,
  latest: InputFilesType,
  transform: FileTransformType[]
): boolean {
  // Initializing variables and constants
  const audFileExts = ["mp3", "wav"]
  const imgFileExts = ["jpeg", "jpg", "png"]
  const vidFileExts = ["mp4", "mov"]

  let staleFileGroups = [["audio", stale.audio], ["image", stale.image], ["other", stale.other], ["video", stale.video]]
  let latestFileGroups = [["audio", latest.audio], ["image", latest.image], ["other", latest.other], ["video", latest.video]]
  let internalLatest = stale

  // Checking if the stale and latest parameters are valid
  for (let checkState of ["checking stale", "checking latest"]) {
    for (let fileGroup of (checkState == "checking stale" ? staleFileGroups : latestFileGroups)) {
      if (typeof fileGroup[1] != "undefined") {
        for (let file of (fileGroup[1] as FileWithMetadata[])) {
          let extension = file.file.slice(file.file.lastIndexOf(".") + 1)
          switch (fileGroup[0]) {
            case 'audio':    
              if (!(audFileExts.includes(extension) && file.customType == "audio")) { return false; } // Maybe throw an exception insted of return to avoid confusion?
              break
            case 'image':    
              if (!(imgFileExts.includes(extension) && file.customType == "image")) { return false; }
              break
            case 'other':    
              if ([...audFileExts, ...imgFileExts, ...vidFileExts].includes(extension) || !(file.customType == "other")) { return false; }
              break
            case 'video':    
              if (!(vidFileExts.includes(extension) && file.customType == "video")) { return false; }
              break
          }
        }
      }
    }
  }

  // Checking if all the transformations are valid and performing the changes to an internal copy of latest
  for (let transformation of transform) {
    let internalFileGroup: (FileWithMetadata[] | String[])[] = []
    let editInternalFileGroup: (files: FileWithMetadata[]) => void = function() {}
    switch (transformation.type.toString()) {
      case 'audio':
        internalFileGroup = [(internalLatest.audio as FileWithMetadata[]), audFileExts]
        editInternalFileGroup = function(files: FileWithMetadata[]) { internalLatest.audio = files }
        break
      case 'image':
        internalFileGroup = [(internalLatest.image as FileWithMetadata[]), imgFileExts]
        editInternalFileGroup = function(files: FileWithMetadata[]) { internalLatest.image = files }
        break
      case 'other':
        internalFileGroup = [(internalLatest.other as FileWithMetadata[]), ["other"]]
        editInternalFileGroup = function(files: FileWithMetadata[]) { internalLatest.other = files }
        break
      case 'video':
        internalFileGroup = [(internalLatest.video as FileWithMetadata[]), vidFileExts]
        editInternalFileGroup = function(files: FileWithMetadata[]) { internalLatest.video = files }
        break
    }
    switch (transformation.state.toString()) {
      case 'Move':       
        if (typeof transformation.position == "undefined" || typeof transformation.secondPosition == "undefined" || typeof transformation.fileObj != "undefined") { return false } // Again, throw exception? 
        if (typeof internalFileGroup[0] == "undefined") { return false }
        if (internalFileGroup[0].length - 1 < Math.max(transformation.position, transformation.secondPosition)) { return false }
        let finishedMGroup = internalFileGroup[0] as FileWithMetadata[]
        const fileToMove =  internalFileGroup[0][transformation.position] as FileWithMetadata
        const fileAtDestination = internalFileGroup[0][transformation.secondPosition] as FileWithMetadata
        finishedMGroup[transformation.secondPosition] = fileToMove
        finishedMGroup[transformation.position] = fileAtDestination
        editInternalFileGroup(finishedMGroup)
        break
      case 'Insert':   
        if (typeof transformation.position != "undefined" || typeof transformation.secondPosition != "undefined" || typeof transformation.fileObj == "undefined") { return false } // Again, throw exception?
        let extension = transformation.fileObj.file.slice(transformation.fileObj.file.lastIndexOf(".") + 1)
        if (internalFileGroup[1][0] == "other") {
          if ([...audFileExts, ...imgFileExts, ...vidFileExts].includes(extension)) { return false }
        } else { 
          if (!(internalFileGroup[1] as String[]).includes(extension)) { return false } 
        }
        if (transformation.fileObj.customType != transformation.type) { return false }
        let finishedIGroup = internalFileGroup[0] as FileWithMetadata[]
        if (typeof finishedIGroup != "undefined") { finishedIGroup.push(transformation.fileObj) } else { finishedIGroup = [transformation.fileObj] }
        editInternalFileGroup(finishedIGroup)
        break
      case 'Delete':   
        if (typeof transformation.position == "undefined" || typeof transformation.secondPosition != "undefined" || typeof transformation.fileObj != "undefined") { return false } // Again, throw exception?
        if (typeof internalFileGroup[0] == "undefined") { return false }
        if (internalFileGroup[0].length - 1 < transformation.position) { return false }
        let finishedDGroup = internalFileGroup[0] as FileWithMetadata[]
        finishedDGroup.splice(transformation.position, 1)
        editInternalFileGroup(finishedDGroup)
        break
    }
  }

  // Checking if the internal copy of latest matches the provided latest
  let assert = require("assert");
  try { assert.deepEqual(internalLatest, latest) } 
  catch (error) { 
    if (error.name === "AssertionError") { return false }
    throw error
  }

  return true
}

let adityaTestTransform1 = isValid(
  {
    video: [
      { file: '1.mp4', customType: 'video' },
      { file: '2.mp4', customType: 'video' },
      { file: '3.mp4', customType: 'video' }
    ],
    other: [
      {file: "5png", customType: "other"}
    ]
  },
  {
    video: [
      { file: '3.mp4', customType: 'video' },
      { file: '2.mp4', customType: 'video' }
    ],
    image: [
      { file: '1.png', customType: 'image' },
      { file: 'gs.png', customType: 'image' },
      // { file: '6.png', customType: 'image' },
    ],
    other: [
      {file: "5png", customType: "other"},
      {file: "6png", customType: "other"}
    ]
  },
  [
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
    // { state: 'Move', position: 2, secondPosition: 1, type: 'image' },
  ]
)

let rahulExTransform1 = isValid(
  {
    video: [
      { file: '1.mp4', customType: 'video' },
      { file: '2.mp4', customType: 'video' },
      { file: '3.mp4', customType: 'video' }
    ]
  },
  {
    video: [
      { file: '2.mp4', customType: 'video' },
      { file: '1.mp4', customType: 'video' }
    ],
    image: [{ file: '1.png', customType: 'image' }]
  },
  [
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
  ]
) // true

let rahulExTransform2 = isValid(
  {},
  {
    video: [
      { file: '1.mov', customType: 'video' },
      { file: '2.mov', customType: 'video' }
    ],
    image: [
      { file: '1.png', customType: 'image' },
      { file: '2.png', customType: 'image' },
      { file: '3.png', customType: 'image' }
    ]
  },
  [
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
  ]
) // false
/***
 * Three reasons why
 * Audio not there
 * Video not deleted
 * Images not moved
 */

let rahulExTransform3 = isValid(
  {
    video: [
      { file: '1.mp4', customType: 'video' },
      { file: '2.mp4', customType: 'video' },
      { file: '3.mp4', customType: 'video' }
    ],
    image: [{ file: '1.png', customType: 'image' }]
  },
  {
    video: [
      { file: '3.mp4', customType: 'video' },
      { file: '1.mp4', customType: 'video' }
    ],
    image: [
      { file: '1.png', customType: 'image' },
      { file: '2.png', customType: 'image' }
    ]
  },
  [
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
  ]
) // false, wrong image deletion

console.log(adityaTestTransform1)
console.log(rahulExTransform1, rahulExTransform2, rahulExTransform3)
