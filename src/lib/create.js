let copy = require("./copy");
let path = require("path");
let fs = require("fs");

let templates = {
  test: {
    filename: path.join(__dirname, "templates", "example.js"),
    variable: "example"
  },
  contract: {
    filename: path.join(__dirname, "templates", "Example.sol"),
    name: "Example",
    variable: "example"
  },
  migration: {
    filename: path.join(__dirname, "templates", "migration.js")
  }
};

let processFile = function(file_path, processfn, callback) {
  // let stat = fs.statSync(file_path);

  fs.readFile(file_path, { encoding: "utf8" }, function(err, data) {
    if (err != null) {
      callback(err);
      return;
    }

    let result = processfn(data);
    fs.writeFile(file_path, result, { encoding: "utf8" }, callback);
  });
};

let replaceContents = function(file_path, find, replacement, callback) {
  processFile(
    file_path,
    function(data) {
      if (typeof find == "string") {
        find = new RegExp(find, "g");
      }
      return data.replace(find, replacement);
    },
    callback
  );
};

let toUnderscoreFromCamel = function(string) {
  string = string.replace(/([A-Z])/g, function($1) {
    return "_" + $1.toLowerCase();
  });

  if (string[0] == "_") {
    string = string.substring(1);
  }

  return string;
};

let Create = {
  contract: function(directory, name, options, callback) {
    if (typeof options == "function") {
      callback = options;
    }

    let from = templates.contract.filename;
    let to = path.join(directory, name + ".sol");

    if (!options.force && fs.existsSync(to)) {
      return callback(
        new Error("Can not create " + name + ".sol: file exists")
      );
    }

    copy.file(from, to, function(err) {
      if (err) return callback(err);

      replaceContents(to, templates.contract.name, name, callback);
    });
  },

  test: function(directory, name, options, callback) {
    if (typeof options == "function") {
      callback = options;
    }

    let underscored = toUnderscoreFromCamel(name);
    underscored = underscored.replace(/\./g, "_");
    let from = templates.test.filename;
    let to = path.join(directory, underscored + ".js");

    if (!options.force && fs.existsSync(to)) {
      return callback(
        new Error("Can not create " + underscored + ".js: file exists")
      );
    }

    copy.file(from, to, function(err) {
      if (err) return callback(err);

      replaceContents(to, templates.contract.name, name, function(err) {
        if (err) return callback(err);
        replaceContents(to, templates.contract.variable, underscored, callback);
      });
    });
  },
  migration: function(directory, name, options, callback) {
    if (typeof options == "function") {
      callback = options;
    }

    let underscored = toUnderscoreFromCamel(name || "");
    underscored = underscored.replace(/\./g, "_");
    let from = templates.migration.filename;
    let filename = (new Date().getTime() / 1000) | 0; // Only do seconds.

    if (name != null && name != "") {
      filename += "_" + underscored;
    }

    filename += ".js";
    let to = path.join(directory, filename);

    if (!options.force && fs.existsSync(to)) {
      return callback(
        new Error("Can not create " + filename + ": file exists")
      );
    }

    copy.file(from, to, callback);
  }
};

module.exports = Create;
