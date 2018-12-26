/*var dataStore = {
  entity: 'ComponentInstance#1',
  dictionaryPaths: {},
  currentDictionaryPath: [],
  currentAttributes: {
    dictionaryPath: [],
    attributes: []
  },
  attributeDictionaries: [
    {
      dictionaryPath: ['dictionary1'],
      attributes: [
        { key: 'attribute1', value: 'abc', type: 'String' },
        { key: 'attribute2', value: 3, type: 'Integer' },
        { key: 'attribute3', value: true, type: 'Boolean' },
      ]
    },
    {
      dictionaryPath: ['dictionary1', 'dictionary11'],
      attributes: [
        { key: 'attribute1', value: 1.23, type: 'Float' },
        { key: 'attribute2', value: false, type: 'Boolean' }
      ]
    },
    {
      dictionaryPath: ['dictionary2'],
      attributes: [
      ]
    },
    {
      dictionaryPath: ['dictionary2', 'dictionary21'],
      attributes: [
        { key: 'attribute1', value: 'abc', type: 'String' },
        { key: 'attribute2', value: 3, type: 'Integer' },
        { key: 'attribute3', value: true, type: 'Boolean' },
      ]
    },
    {
      dictionaryPath: ['dictionary2', 'dictionary21', 'dictionary211'],
      attributes: [
        { key: 'attribute1', value: 'abc', type: 'String' },
        { key: 'attribute2', value: 3, type: 'Integer' },
        { key: 'attribute3', value: true, type: 'Boolean' },
      ]
    },
    {
      dictionaryPath: ['dictionary2', 'dictionary22'],
      attributes: [
        { key: 'attribute1', value: 'abc', type: 'String' },
        { key: 'attribute2', value: 3, type: 'Integer' },
        { key: 'attribute3', value: true, type: 'Boolean' },
      ]
    },
    {
      dictionaryPath: ['dictionary3'],
      attributes: [
        { key: 'attribute1', value: 'abc', type: 'String' },
        { key: 'attribute2', value: 3, type: 'Integer' },
        { key: 'attribute3', value: true, type: 'Boolean' },
      ]
    }
  ]
};*/

var testData = {
  entity: {
    title: 'Edge',
    related: {
      title: 'Arc',
      id: '0x678987659285'
    }
  },
  dictionaries: {
    'dictionary1': {
      'dictionary11': null
    },
    'dictionary2': {
      'dictionary21': {
        'dictionary211': null
      },
      'dictionary22': null
    },
    'dictionary3': null
  },
  nonCommonDictionaries: {
    'dictionary2': {
      'dictionary21': {
        'dictionary211': null
      }
    },
    'dictionary3': null
  },
  attributes: {
    'dictionary1': [
      { key: 'attribute1', value: 'abc', type: 'String' },
      { key: 'attribute2', value: 3, type: 'Integer' },
      { key: 'attribute3', value: true, type: 'Boolean' }
    ],
    'dictionary1,dictionary11': [
      { key: 'a-1', value: 1.23, type: 'Float' },
      { key: 'a0', value: false, type: 'Boolean' }
    ],
    'dictionary2': [
      { key: 'a1', value: 'def', type: 'String' },
      { key: 'a2', value: 4, type: 'Float' },
      { key: 'a3', value: true, type: 'Boolean' }
    ],
    'dictionary2,dictionary21': [
      { key: 'a4', value: 'ghi', type: 'String' },
      { key: 'a5', value: 5, type: 'Integer' },
      { key: 'a6', value: true, type: 'Boolean' }
    ],
    'dictionary2,dictionary21,dictionary211': [
      { key: 'a7', value: 'jkl', type: 'String' },
      { key: 'a8', value: 6, type: 'Integer' },
      { key: 'a9', value: true, type: 'Boolean' }
    ],
    'dictionary2,dictionary22': [
      { key: 'a10', value: 'mno', type: 'String' },
      { key: 'a11', value: 7, type: 'Integer' },
      { key: 'a12', value: true, type: 'Boolean' }
    ],
    'dictionary3': [
      { key: 'a13', value: 'pqr', type: 'String' },
      { key: 'a14', value: 8, type: 'Integer' },
      { key: 'a15', value: true, type: 'Boolean' }
    ],
    'dictionary3,dictionary4': [
      { key: 'a16', value: 1.78, type: 'Float' },
      { key: 'a17', value: false, type: 'Boolean' }
    ],
  }
};

var currentSelection = {
  entity: testData.entity,
  dictionaries: testData.dictionaries,
  attributes: testData.attributes
};

function selectNoEntity() {
  currentSelection.entity = {};
  currentSelection.dictionaries = {};
  currentSelection.attributes = {};
  app.refresh();
}

function selectEntityWithNoDictionaries() {
  currentSelection.entity = testData.entity;
  currentSelection.dictionaries = {};
  currentSelection.attributes = {};
  app.refresh();
}

function selectEntityWithNoAttributes() {
  currentSelection.entity = testData.entity;
  currentSelection.dictionaries = testData.dictionaries;
  currentSelection.attributes = {};
  app.refresh();
}

function selectEntity1() {
  currentSelection.entity = testData.entity;
  currentSelection.dictionaries = testData.dictionaries;
  currentSelection.attributes = testData.attributes;
  app.refresh();
}

function selectEntity2() {
  currentSelection.entity = {
    title: 'ComponentInstance',
    related: {
      title: 'ComponentDefinition',
      id: '0x9764839062356'
    }
  };
  currentSelection.dictionaries = {
    'd1': {
      'd11': null
    }
  };
  currentSelection.attributes = {
    'd1': [
      { key: 'a1', value: 'abc', type: 'String' },
      { key: 'a2', value: 3, type: 'Integer' },
      { key: 'a3', value: true, type: 'Boolean' }
    ],
    'd1,d11': [
      { key: 'a-1', value: 1.23, type: 'Float' },
      { key: 'a0', value: false, type: 'Boolean' }
    ]
  };
  app.refresh();
}

var Bridge = {
  call: function (command, arg1, arg2, arg3, arg4, arg5) {
    console.log('Bridge.call(' + [command, arg1, arg2, arg3, arg4, arg5].filter(e => e != undefined).map(e => JSON.stringify(e)).join(', ') + ')');
    switch (command) {
      case 'loaded': break;
      case 'translate': break;
      case 'copy_dictionary': break;
      case 'copy_attributes':
        var sourcePath = arg1, sourceAttribute = arg2;
        break;
      case 'get_attributes':
        var path = arg1;
        break;
      case 'view_refreshed': break;
      case 'set_mode': break;
    }
  },
  get: function (command, arg1, arg2, arg3, arg4, arg5) {
    console.log('Bridge.get(' + [command, arg1, arg2, arg3, arg4, arg5].filter(e => e != undefined).map(e => JSON.stringify(e)).join(', ') + ')');
    var result;
    switch (command) {
      case 'settings':
        result = {};
        break;
      case 'get_dictionaries':
        result = currentSelection.dictionaries;
        break;
      case 'get_non_common_dictionaries':
        result = testData.nonCommonDictionaries;
        break;
      case 'get_attributes':
        var path = arg1;
        result = currentSelection.attributes[path];
        if (!result) result = [];
        break;
      case 'get_entity':
        result = currentSelection.entity;
        break
      case 'get_title': // deprecated
        result = 'Edge';
        break
      case 'get_related': // deprecated
        result = ['Arc', '0x678987659285'];
        break;
      case 'paste_dictionary': break;
      case 'paste_attributes':
        var targetPath = arg1, targetAttribute = arg2;
        break;
      case 'add_dictionary':
        var newPath = arg1;
        break;
      case 'rename_dictionary': break;
        var oldPath = arg1, newName = arg2;
        break;
      case 'remove_dictionary':
        var selectedPath = arg1;
        break;
      case 'set_attribute':
        var path = arg1, key = arg2, value = arg3, type = arg4;
        break;
      case 'rename_attribute':
        var path = arg1, oldKey = arg2, newKey = arg3;
        break;
      case 'remove_attribute':
        var path = arg1, key = arg2;
        result = true;
        break;
      case 'select': break;
    }
    return Promise.resolve(result);
  },
  puts: function (string) {
    console.log(string);
  }
}
