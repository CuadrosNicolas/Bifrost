var ipc = require('electron').ipcRenderer;
WritingDiv = document.getElementById('Begin');
var alignment = "left";
var report = "";
var log = "";
var processRunning=false;
function alignDiv()
{
	let Div = document.createElement("div");
	Div.className = "begin";
	WritingDiv.appendChild(Div);
	return Div;

}
DefaultWriteFunction = (request)=>
{
	return (data)=>{
			let Div = alignDiv();
			let A = document.createElement("p");
			Div.appendChild(A);
			A.innerHTML = data;
			report += data+"\n";
			log += data + "\n";
	}
};
var writeFunction = DefaultWriteFunction(null);
function sameline(request)
{
	let Div = alignDiv();
	let p = Div.parentNode;
	return (data) => {
		while(Div.firstChild)
		{
			Div.firstChild.remove();
		}
		let A = document.createElement("p");
		A.innerHTML += data;
		Div.appendChild(A);
		Div.parentNode.removeChild(Div);
		p.appendChild(Div);
		report += data + "\n";
		log += data + "\n";

	};
}
function header(request)
{
	return (data) =>{
		let Div = alignDiv();
		let A = document.createElement("h"+request.level);
		A.innerHTML = data;
		Div.appendChild(A);
		writeFunction = DefaultWriteFunction(null);
		report += "#".repeat(request.level)+" "+data + "\n";
		log += data + "\n";
	}
}
function input(request)
{
	return (data)=>
	{
		let div = alignDiv();
		let label = document.createElement("label");
		label.style.display = "inline-block";
		label.style.width = "140px";
		label.style.textAlign = "left";
		label.innerHTML = data;
		let A = document.createElement("input");
		A.type = request.type;
		if(request.type === "dir")
		{
			A.type = "file";
			A.webkitdirectory = true;
		}
		A.autofocus = true;
		let button = document.createElement("button");
		button.type = "button";
		button.innerHTML = "validate";
		validation = (event)=>{
			content = A.value;
			if (request.type === "file" || request.type ==="dir") {
				arrOfFile = [...A.files];
				arrOfFile = arrOfFile.map((f)=>f.path);
				content = arrOfFile.join(';');
			}
			report += data + content + "\n";
			log += data + content + "\n";
			ipc.send('input', content);
			A.disabled = true;
			button.disabled = true;
		}
		button.onclick = (event) => {
			validation(event);
		};
		A.addEventListener("keyup", function (event) {
			event.preventDefault();
			if (event.keyCode === 13) {
				validation(event);
			}
		});
		div.appendChild(label);
		div.appendChild(A);
		div.appendChild(button);
		writeFunction = DefaultWriteFunction(null);
	}
}
function combobox(request)
{
	return (data)=>{
		let div = alignDiv()
		let label = document.createElement("label");
		label.style.display = "inline-block";
		label.style.width = "auto";
		label.style.textAlign = "left";
		label.style.marginRight = "5px";
		label.innerHTML = data;
		let combobox = document.createElement("select");
		combobox.style.marginRight = "5px";
		combobox.autofocus = true;
		let arr = request.values;
		arr.forEach(element => {
			let opt = document.createElement("option");
			opt.value = element;
			opt.innerHTML = element;
			combobox.appendChild(opt);
		});
		let button = document.createElement("button");
		button.type = "button";
		button.innerHTML = "Choose";
		button.onclick = (event) => {
			report += data + combobox.value + "\n";
			log += data +combobox.value + "\n";
			ipc.send('input', combobox.value);
			combobox.disabled = true;
			button.disabled = true;
		};
		div.appendChild(label);
		div.appendChild(combobox);
		div.appendChild(button);
	writeFunction = DefaultWriteFunction(null);
	}
}
function table(request)
{
	let A = document.createElement("table");
	A.className = "middle";
	let div = alignDiv();
	let tempReport="";
	div.appendChild(A);
	//WritingDiv.appendChild(div);
	return (data)=>
	{
		let arr = data.split(request.separator);
		log += data+"\n";
		arr.forEach(element=>{
			let tempHead = document.createElement("th");
			tempHead.innerHTML = element;
			report += element +" | ";
			tempReport += element + " | ";
			A.appendChild(tempHead);
		});
		report += "\n";
		for(const c of tempReport)
		{
			if(c=='|')
			{
				report+= "|";
			}
			else
			{
				report+='-';
			}
		}
		report+="\n";
		writeFunction = (data)=>{
			let Arr = data.split(request.separator);
			let line = document.createElement("tr");
			A.appendChild(line);
			Arr.forEach(element => {
				report+=element + " | ";
				let cell = document.createElement("td");
				cell.innerHTML = element;
				line.appendChild(cell);
			});
			report += "\n";
			log+= data+"\n";
		}

	}
}
function image(request)
{
		let Div = alignDiv();
		let A = document.createElement("img");
		A.src = request.path;
		A.style.height = "auto%";
		A.style.width = "auto";
		A.style.maxHeight = "90%";
		A.style.maxWidth = "90%";
		A.style.marginLeft = "1%";
		A.style.marginRight = "1%";
		Div.appendChild(A);
		//WritingDiv.appendChild(Div);
		report += "![]("+request.path+")\n";
		return DefaultWriteFunction(null);
}
function left(request)
{
	alignment = "left";
	return DefaultWriteFunction(null);
}
function middle(request) {
	alignment = "middle";
	return DefaultWriteFunction(null);
}
function right(request)
{
	alignment = "right";
	return DefaultWriteFunction(null);
}
function chdir(request)
{
	process.chdir(request.path);
	return DefaultWriteFunction(null);
}
/**
 * Define all the different type of command and link them to a function
 */
COMMAND_TABLE = {
	'title' : header,
	'end'	: (request)=>{return DefaultWriteFunction},
	'input' : input,
	'combobox' : combobox,
	'table'    : table,
	'image'		: image,
	"left"		:left,
	"middle"   : middle,
	"right"		: right,
	"sameline" : sameline,
	"cwd"		: chdir
}
function AcceptCommand(cmd)
{
	writeFunction = COMMAND_TABLE[cmd.name](cmd.request);
}
function Write(data)
{
	if(data!=="")
		writeFunction(data);
}
ipc.on('cmd',(event,data)=>{
	AcceptCommand(data);
});
ipc.on('write',(event,data)=>
{
	Write(data);
});
ipc.on('end_program_run', (event) => {
	let A = document.createElement("p");
	A.innerHTML = "<strong>END OF PROGRAM</strong>";
	WritingDiv.appendChild(A);
	ipc.send('report',[report,log]);
});
ipc.send('loaded');

function changeCWD()
{
	var currentDir = document.getElementById('currentDir');
	currentDir.innerHTML = process.cwd()+">>";

}
ipc.on('cwd',(event,data)=>
{
changeCWD(data);
});
changeCWD(process.cwd());
var entry = document.getElementById("textentry");
var Hist = document.getElementById("history");
entry.addEventListener("keyup", function (event) {
	event.preventDefault();
	if(event.keyCode===9)
	{
		entry.value+="\t";
	}
	if (event.keyCode === 13 && entry.value!="") {
		let val = entry.value;
		Hist.innerHTML += entry.value+"\n";
		Hist.scrollTop = Hist.scrollHeight;
		entry.value = "";
		arr = val.split(' ').filter(x=>x!="");
		if(arr[0]==="cd")
		{
			process.chdir(arr[1]);
			changeCWD();
			ipc.send('chdir',arr[1]);
		}else if(arr[0]==="run")
		{
			val = arr.slice(1).join(' ');
			ipc.send('cmd',val);
		}
		else if(arr[0]==="kill")
		{
			ipc.send('kill');
		}
		else if(arr[0]==="flush")
		{
			if(processRunning)
			{
				Hist.innerHTML = "";
				while (WritingDiv.firstChild) {
					WritingDiv.firstChild.remove();
				}
			}
			else
			{
				Hist.innerHTML += "Error : a process is running\n";
				Hist.scrollTop = Hist.scrollHeight;

			}
		}
		else
		{
			ipc.send('bsh',val);
		}
	}
});
ipc.on('begin',(event)=>
{
	pocessRunning = true;
});
ipc.on('end_program',(event)=>
{
	pocessRunning = false;
})
ipc.on('bshanswer',(event,data)=>
{
	Hist.innerHTML+=data;
	Hist.scrollTop = Hist.scrollHeight;

});
ipc.on('err',(event,data)=>
{
	Hist.innerHTML += "Error : "+data+"\n";
	Hist.scrollTop = Hist.scrollHeight;

});