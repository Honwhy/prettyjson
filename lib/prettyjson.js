'use strict';

// ### Render function
// *Parameters:*
//
// * **`data`**: Data to render
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       defaultIndentation: 2     // Indentation on nested objects
//     }
exports.render = function render(data, options, indentation) {
  // Default values
  indentation = indentation || 0;
  options = options || {};
  options.defaultIndentation = options.defaultIndentation || 2;

  var output = [];

  // Helper function to detect if an object can be directly serializable
  var isSerializable = function(input, onlyPrimitives) {
    if (typeof input === 'boolean' ||
        typeof input === 'number' || input === null) {
      return true;
    }
    if (typeof input === 'string' && input.indexOf('\n') === -1) {
      return true;
    }

    return false;
  };

  var indentLines = function(string, spaces){
    var lines = string.split('\n');
    lines = lines.map(function(line){
      return indent(spaces) + line;
    });
    return lines.join('\n');
  };

  var outputData = function(input) {

    if (typeof input === 'string') {
      // Print strings wraped by double quote
      return '"' + input + '"';
    }

    if (input === true) {
      return 'true';
    }
    if (input === false) {
      return 'false';
    }
    if (input === null) {
      return '';
    }
    if (typeof input === 'number') {
      return input;
    }

    return input;
  };
  var removeLastComma = function(output) {
      var lastElement = output[output.length-1];
      output[output.length-1] = lastElement.substr(0, lastElement.length-1);
  };
  var indent = function(numSpaces) {
    return new Array(numSpaces+1).join(' ');
  };
  // Render a string exactly equal
  if (isSerializable(data)) {
    output.push(indent(indentation) + outputData(data));
  }
  else if (typeof data === 'string') {
    var lines = data.split('\n');
    lines.map(function(line){
      return indent(indentation + options.defaultIndentation) + '"' + line + '"';
    });
    output.push(lines.join(',\n'));
  }
  else if (Array.isArray(data)) {
    var line = indent(indentation);
    indentation = indentation + options.defaultIndentation;
    output.push(line + '[');
    // If the array is empty
    if (data.length === 0) {
      output.push(indent(indentation) +' ');
    } else {
      data.forEach(function(element) {
        if(isSerializable(element)) {
            output.push(indent(indentation) + outputData(element) + ',');
        }else {
            output.push(exports.render(element, options, indentation) + ',');
        }
      });
      removeLastComma(output);
    }
    output.push(line + '],');
  }
  else if (typeof data === 'object') {
    var line = indent(indentation);
    output.push(line+'{');
    var key;
    var isError = data instanceof Error;
    indentation = indentation + options.defaultIndentation;
    Object.getOwnPropertyNames(data).forEach(function(i) {
      // Prepend the index at the beginning of the line
      key = ('"' + i +'"'+ ': ');
      key = indent(indentation) + key;
      
      // Skip `undefined`, it's not a valid JSON value.
      if (data[i] === undefined) {
        return;
      }
      if(isSerializable(data[i])) {
        output.push(key + outputData(data[i]) + ',');
      }else {
        var temp = exports.render(data[i], options, indentation);
        output.push(key + temp.trim() + ',');
      }
    });
    removeLastComma(output);
    output.push(line + '},');
  }
  removeLastComma(output);
  // Return all the lines as a string
  return output.join('\n');
};

// ### Render from string function
// *Parameters:*
//
// * **`data`**: Data to render as a string
// * **`options`**: Hash with different options to configure the parser
// * **`indentation`**: Base indentation of the parsed output
//
// *Example of options hash:*
//
//     {
//       defaultIndentation: 2     // Indentation on nested objects
//     }
exports.renderString = function renderString(data, options, indentation) {

  var output = '';
  var parsedData;
  // If the input is not a string or if it's empty, just return an empty string
  if (typeof data !== 'string' || data === '') {
    return '';
  }

  // Remove non-JSON characters from the beginning string
  if (data[0] !== '{' && data[0] !== '[') {
    var beginingOfJson;
    if (data.indexOf('{') === -1) {
      beginingOfJson = data.indexOf('[');
    } else if (data.indexOf('[') === -1) {
      beginingOfJson = data.indexOf('{');
    } else if (data.indexOf('{') < data.indexOf('[')) {
      beginingOfJson = data.indexOf('{');
    } else {
      beginingOfJson = data.indexOf('[');
    }
    output += data.substr(0, beginingOfJson) + '\n';
    data = data.substr(beginingOfJson);
  }

  try {
    parsedData = JSON.parse(data);
  } catch (e) {
    // Return an error in case of an invalid JSON
    return 'Error:' + ' Not valid JSON!';
  }

  // Call the real render() method
  output += exports.render(parsedData, options, indentation);
  return output;
};
