
/*test("module without setup/teardown (default)", function() {
  expect(1);
  ok(true);
});

test("expect in test", 3, function() {
  ok(true);
  ok(true);
  ok(true);
});*/

function onError(e) {
  ok(false, 'unexpected error ' + e.name);
  start();
};

module('init()', {
  setup: function() {
    if (document.location.protocol == 'file:') {
      ok(false, 'These tests need to be run from a web server over http://.');
    }

    this.filer = new Filer();
  },
  teardown: function() {

  }
});


/*asyncTest('browser not supported', 1, function() {
  this.filer = new Filer();

  raises(function() {
    var temp = window.requestFileSystem;
    window.requestFileSystem = null; // pretend we're a browser without support.
    this.filer.init({}, function(fs) {});
    window.requestFileSystem = temp;
  }, 'BROWSER_NOT_SUPPORTED thrown');

  start();

});*/

test('default arguments', 6, function() {
  var filer = this.filer;

  equals(filer.isOpen, false, 'filesystem not open');

  stop();
  filer.init({}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE, filer.size,
           'default size used == ' + Filer.DEFAULT_FS_SIZE);
    equals(self.TEMPORARY, filer.type, 'TEMPORARY storage used by default');
    equals(filer.isOpen, true, 'filesystem opened');

    var filer2 = new Filer(filer.fs);
    ok(filer2.fs === filer.fs,
       'filesystem initialized with existing DOMFileSystem object');
    start();
  }, onError);

  stop();
  filer.init(null, function(fs) {
    ok('null used as first arg to init()');
    start();
  }, onError);
});

test('set size', 2, function() {
  var filer = new Filer();

  stop();
  filer.init({persistent: false, size: Filer.DEFAULT_FS_SIZE * 5}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE * 5, filer.size,
           'size set to ' + Filer.DEFAULT_FS_SIZE * 5);
    start();
  }, onError);

  stop();
  var filer2 = new Filer();
  filer2.init({persistent: true, size: Filer.DEFAULT_FS_SIZE * 2}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE * 2, filer2.size,
           'persistent size set to ' + Filer.DEFAULT_FS_SIZE * 2);
    start();
  }, onError);

});

test('storage type', 4, function() {
  var filer = this.filer;

  stop();
  filer.init({}, function(fs) {
    equals(Filer.DEFAULT_FS_SIZE, filer.size,
           'default size used == ' + Filer.DEFAULT_FS_SIZE);
    equals(self.TEMPORARY, filer.type,
           'TEMPORARY storage used by default');
    start();
  }, onError);

  stop();
  var filer2 = new Filer();
  filer2.init({persistent: false}, function(fs) {
    equals(self.TEMPORARY, filer2.type,
           'TEMPORARY storage used');
    start();
  }, onError);

  var filer3 = new Filer();
  filer3.init({persistent: true}, function(fs) {
    equals(self.PERSISTENT, filer3.type,
           'PERSISTENT storage used');
    start();
  }, onError);

});


module('helpers', {
  setup: function() {
    this.filer = new Filer();
    stop();
    this.filer.init({}, function(fs) {
      start();
    }, onError);
  },
  teardown: function() {

  }
});


test('pathToFilesystemURL()', 5, function() {
  var filer = this.filer;
  var fsURL = 'filesystem:' + document.location.origin + '/temporary/';
  var path = 'test/me';

  equals(filer.pathToFilesystemURL('/'), fsURL, 'root as arg');
  equals(filer.pathToFilesystemURL(fsURL), fsURL, 'filesystem URL as arg');
  equals(filer.pathToFilesystemURL(fsURL + path), fsURL + path, 'filesystem URL as arg2');
  equals(filer.pathToFilesystemURL('/' + path), fsURL + path, 'abs path as arg');
  equals(filer.pathToFilesystemURL(path), fsURL + path, 'relative path as arg');
});

module('methods', {
  setup: function() {
    this.filer = new Filer();
    this.FOLDER_NAME = 'filer_test_case_folder';
    this.FILE_NAME = 'filer_test_case.filer_test_case';
    stop();
    this.filer.init({}, function(fs) {
      start();
    }, onError);
  },
  teardown: function() {
    /*stop();
    this.filer.rm(this.FOLDER_NAME, function() {
      //start();
    }, onError);*/
  }
});

test('mkdir()', 7, function() {
  var filer = this.filer;
  var folderName = this.FOLDER_NAME + Date.now();

  ok(filer.isOpen, 'FS opened');

  stop();
  filer.mkdir(folderName, false, function(entry) {
    ok(entry.isDirectory, 'created folder is a DirectoryEntry');
    equals(entry.name, folderName, 'created folder is named "' + folderName + '"');
    start();
  }, onError);

  stop();
  filer.mkdir(folderName, null, function(entry) {
    ok(true);
    start();
  }, function(e) {
    ok(false, "Default exclusive parameter is not false");
    start();
  });

  stop();
  filer.mkdir(folderName, true, function(entry) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Attempted to create a folder that already exists");
    start();
  });

  stop();
  var folderName2 = folderName + '2';
  var fullPath = [folderName2, folderName2, folderName2 + '_end'].join('/');
  filer.mkdir(fullPath, false, function(entry) {
    equals(entry.name, folderName2 + '_end', 'last created folder is named "' + folderName2 + '_end"');
    equals(entry.fullPath, '/' + fullPath, "Subfolders created properly");
    filer.rm(folderName2, function() {
      start();
    }, onError);
  }, onError);

  /*// Try to create a folder without first calling init().
  var filer2 = new Filer();
  try {
    stop();
    filer2.mkdir(folderName, false, function(entry) {}, onError);
  } catch (e) {
    ok(true, 'Attempt to use this method before calling init()');
    start();
  }*/

  // Stall clean up for a bit so all tests have run.
  setTimeout(function() {
    stop();
    filer.rm(folderName, function() {
      start();
    }, onError);
  }, 500);

});


test('ls()', 6, function() {
  var filer = this.filer;

  ok(filer.isOpen, 'FS opened');
  ok(self.TEMPORARY == filer.type, 'TEMPORARY storage used');

  stop();
  filer.ls('.', function(entries) {
    ok(entries.slice, 'returned entries is an array') // Verify we got an Array.
    filer.ls('/', function(entries2) {
      equals(entries.length, entries2.length, 'Num root entries matches');
      start();
    }, onError);
  }, onError);

  stop();
  filer.ls('/myfolderthatdoesntexist' + Date.now(), function(entries) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Path doesn't exist");
    start();
  });

  stop();
  filer.ls(filer.fs.root, function(entries) {
    ok(true, 'DirEntry as argument');
    start();
  }, function(e) {
    ok(false);
    start();
  });

  /* //Try to create a folder without first calling init().
  var filer2 = new Filer();
  try {
    stop();
    filer2.ls('.', function(entries) {
      start();
    }, onError);
  } catch (e) {
    ok(true, 'Attempted to use this method before calling init()');
    start();
  }*/

});


test('cd()', 5, function() {
  var filer = this.filer;
  var folderName = this.FOLDER_NAME + Date.now();

  stop();
  filer.cd('.', function(dirEntry) {
    ok(dirEntry.isDirectory, 'cd folder is a DirectoryEntry');
    start();
  }, onError);

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd(folderName, function(dirEntry2) {
      ok(true, 'cd with path name as an argument.');
      start();
    }, onError);
  });

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd('/' + folderName, function(dirEntry2) {
      ok(true, 'cd with abspath name as an argument.');
      start();
    }, onError);
  });

  stop();
  filer.mkdir(folderName, false, function(dirEntry) {
    filer.cd(dirEntry, function(dirEntry2) {
      ok(true, 'cd with DirectoryEntry as an argument.');
      filer.ls('.', function(entries) {
        equals(entries.length, 0, 'Empty directory');
        start();
      }, onError);
    }, onError);
  });

  // Stall clean up for a bit so all tests have run.
  setTimeout(function() {
    stop();
    filer.rm(folderName, function() {
      start();
    }, onError);
  }, 500);

  // TODO: test optional callback args to cd().
});


test('create()', 3, function() {
  var filer = this.filer;
  var fileName = this.FILE_NAME + Date.now();

  stop();
  filer.create(fileName, false, function(entry) {
    ok(entry.isFile, 'created folder is a FileEntry');
    equals(entry.name, fileName, 'created file named "' + fileName + '"');
    start();
  }, onError);

  stop();
  filer.create(fileName, true, function(entry) {
    ok(false);
    start();
  }, function(e) {
    ok(true, "Attempted to create a file that already exists");
    start();
  });

  // Stall clean up for a bit so all tests have run.
  setTimeout(function() {
    stop();
    filer.rm(fileName, function() {
      start();
    }, onError);
  }, 500);
});


test('rm()', 5, function() {
  var filer = this.filer;
  var fileName = this.FILE_NAME + Date.now();
  var folderName = this.FOLDER_NAME + Date.now();

  stop();
  filer.create(fileName, false, function(entry) {
    filer.rm(fileName, function() {
      ok(true, fileName + ' removed file by path.')
      start();
    }, onError);
  }, onError);

  stop();
  var fileName2 = fileName + '2';
  filer.create(fileName2, false, function(entry) {
    filer.rm(entry, function() {
      ok(true, fileName2 + ' removed file by entry.')
      start();
    }, onError);
  }, onError);

  stop();
  var fileName3 = fileName + '3';
  filer.create(fileName3, false, function(entry) {
    var fsURL = filer.pathToFilesystemURL(entry.fullPath);
    filer.rm(fsURL, function() {
      ok(true, fileName3 + ' removed file by filesystem URL.')
      start();
    }, onError);
  }, onError);

  stop();
  filer.mkdir(folderName, false, function(entry) {
    filer.rm(folderName, function() {
      ok(true, folderName + ' removed dir by path.')
      start();
    }, onError);
  }, onError);

  stop();
  var folderName2 = folderName + '2';
  filer.mkdir(folderName2, false, function(entry) {
    filer.rm(entry, function() {
      ok(true, folderName2 + ' removed dir by entry.')
      start();
    }, onError);
  }, onError);
});


test('cp()', 0, function() {
  var filer = this.filer;
  var fileName = this.FILE_NAME;
  var folderName = this.FOLDER_NAME + Date.now();
});

/*
test('rename()', 1, function() {

});
*/

/*
test('write()', 1, function() {

});
*/

/*
test('open()', 1, function() {

});
*/

