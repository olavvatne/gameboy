module.exports = {
    "extends": "airbnb-base",
    "rules": {
        "no-underscore-dangle": 0,
    },
    "env": {
        "node": true,
        "mocha": false,
    },
    "globals": {
        "it": true,
        "describe": true
    },
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 7,
        "sourceType": "module",
        "ecmaFeatures": {
            "arrowFunctions": true,
            "binaryLiterals": true,
            "blockBindings": true,
            "classes": true,
            "defaultParams": true,
            "destructuring": true,
            "forOf": true,
            "generators": true,
            "modules": true,
            "objectLiteralComputedProperties": true,
            "objectLiteralDuplicateProperties": true,
            "objectLiteralShorthandMethods": true,
            "objectLiteralShorthandProperties": true,
            "octalLiterals": true,
            "regexUFlag": true,
            "regexYFlag": true,
            "spread": true,
            "superInFunctions": true,
            "templateStrings": true,
            "unicodeCodePointEscapes": true,
            "globalReturn": true,
            "jsx": false,
            "experimentalObjectRestSpread": true
        }
    },
    "overrides": [
        {
            "files": "*.test.js",
            "rules": {
                "no-unused-expressions": "off",
            }
        }
    ]
};
