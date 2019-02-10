// Modules to control application life and create native browser window
const {app, BrowserWindow,ipcMain} = require('electron')
const fs = require('fs');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
/**
 * Define the table, associating type of request to each element of a request
 * Each element are associated to an index of the command array
 * '...' mean the rest of the array
 */
let CommandTable = {};
CommandTable["title"] = {'level':0};
CommandTable["table"] = {'separator':0};
CommandTable["end_table"] = {};
CommandTable["input"] = {'type':0};
CommandTable["combobox"] = {'values':'...'};
CommandTable["image"] = {'path':0};
CommandTable["left"] = {};
CommandTable["middle"] = {};
CommandTable["right"] = {};
CommandTable["sameline"] = {};
CommandTable["cwd"]     = {'path':0};
/**
 * Filter the data receive via stdout
 * Define if it's a command or just a text
 * If it's command, parse the command to make a request to the page
 * Else send text to write
 */
function filterData(data)
{

  let Arr = data.split('\n');
  Arr.forEach(element => {
    if (element.startsWith("%:")) {
      let arr = element.replace("%:", "").split(' ');
      let name = arr[0];
      arr = arr.slice(1);
      let pattern = CommandTable[name];
      let request = {};
      let actual = 0;
      for(element in pattern)
          {
            if(pattern[element]==='...')
            {
              arr = arr.slice(actual);
              request[element] = arr;
            }
            else
            {
              request[element] = arr[pattern[element]+actual];
              actual++;
            }
          };
        cmd = {};
        cmd['name'] = name;
        cmd['request'] = request;

          mainWindow.webContents.send('cmd',cmd);

    }
    else{
      mainWindow.webContents.send('write',element);
    }
  });
}
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600,"webPreferences":{"webSecurity":false}})

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.setMenuBarVisibility(false);
  var prog = null;
  ipcMain.on('chdir', (event, data) => {
    process.chdir(data);
  });
  ipcMain.on('kill', (event, data) => {
    if(prog===null)
    {
      mainWindow.webContents.send('err', "There is no process running.");

    }
    else
    {
      process.kill(prog.pid);
      prog = null;
      mainWindow.webContents.send('end_program');
    }
  });
  ipcMain.on('bsh', (event, val) => {
    if(prog===null)
    {
      prog = require('child_process').spawn(val);
      mainWindow.webContents.send('begin');
      //Redirect ouput of the program
      let data;
      prog.stdout.on('readable', function () {
        if (prog!==null && (data = prog.stdout.read()) !== null) {
          //Get the printed data from the program
          data = data.toString();
          //Filter and write data
          mainWindow.webContents.send('bshanswer',data);
        }
      });
      prog.stdout.on('end', function () {
        mainWindow.webContents.send('end_program');
        prog = null;
      });
    }
    else
    {
      mainWindow.webContents.send('err', "Error : cna't have 2 process running, use kill to stop the running program");
    }
  });
  ipcMain.on('cmd',(event,val)=> {
    if(prog===null)
    {
      prog = require('child_process').spawn(val);
      mainWindow.webContents.send('begin');
    //Redirect ouput of the program
    let data;
    prog.stdout.on('end', function () {
      mainWindow.webContents.send('end_program');
      mainWindow.webContents.send('end_program_run');
      prog = null;
    });
    prog.stdout.on('readable', function () {
        if ( prog!==null && (data = prog.stdout.read()) !== null) {
          //Get the printed data from the program
          data = data.toString();
          //Filter and write data
          if(data!="  ")
            filterData(data);
        }
    });
    ipcMain.on('report',(event,report)=>
    {
      fs.writeFile("./report.md",report[0],(err)=>
      {
        if(err)
        {
          mainWindow.webContents.send('err',"ERROR WHILE WRITING REPORT.MD");
        }
      });
      fs.writeFile("./report.log", report[1], (err) => {
        if (err) {
          mainWindow.webContents.send('err',"ERROR WHILE WRITING REPORT.LOG");
        }
      });
    });
    prog.stdout.on('end', function () {
      mainWindow.webContents.send('end_program');
      prog = null;
    });
    prog.stderr.on('data', function (buf) {
      try{
      if (prog !== null && mainWindow !== null) {
        mainWindow.webContents.send('write', buf.toString('utf8'));
      }
      }
      finally{}
    });
    ipcMain.on('input',(event,data)=>
    {
      prog.stdin.write(data+'\n');
    });
  }
  else
  {
        mainWindow.webContents.send('err', "Error : cna't have 2 process running, use kill to stop the running program");
  }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if(prog!=null)
    {
      prog.kill('SIGINT');
    }
    mainWindow = null
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
