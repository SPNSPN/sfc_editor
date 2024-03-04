let canvas;
let context;
let objects;
let dragging = [];

window.addEventListener("load", () => {

	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");
	objects = [];

	canvas.addEventListener("mousedown", onDown, false);
	canvas.addEventListener("mousemove", onMove, false);
	canvas.addEventListener("mouseup", onUp, false);


});

function loadStatus(path, x, y, w, h)
{
	fetch(path)						
		.then(response =>
			{
				if (!response.ok) { throw new Error(`Fail Request FileOpen: ${response.status}`); }
				return response.text();
			})
		.then(data =>
			{
				let box = genBox(path, x, y, w, h);
				data.split("\n").forEach((row) =>
					{
						let rows = row.split(",");
						box.addChild(rows[0]);
					});
				redraw();
			})
		.catch(error =>
			{
				console.error(`Fail Request FileOpen: ${error}`);
			});
}

/*
function loadStatus(f, x, y, w, h)
{
	const reader = new FileReader();
	reader.onload = (e) =>
	{
		let box = genBox(f.data, x, y, w, h);
		reader.result.split("\n").forEach((row) =>
			{
				let rows = row.split(",");
				box.addChild(rows[0]);
			});
		redraw();
	};
	reader.readAsText(new File([f]));
}
*/

function loadCombo(path, x, y)
{
}


function loadCycle(path, x, y)
{
}


function onDown(e)
{
	let cvleft = canvas.getBoundingClientRect().left;
	let cvtop = canvas.getBoundingClientRect().top;

	let x = e.clientX - cvleft;
	let y = e.clientY - cvtop;

	let touch = objects.find((obj) => ("box" == obj.type) && (!obj.parent_) &&
										(obj.x < x) && (x < obj.x + obj.w) &&
										(obj.y < y) && (y < obj.y + obj.h));
	if (touch)
	{
		dragging.push(touch);
		touch.dragx = touch.x - x;
		touch.dragy = touch.y - y;
		touch.children.forEach((cobj) =>
			{
				cobj.dragx = cobj.x - x;
				cobj.dragy = cobj.y - y;
				dragging.push(cobj);
			});
	}
}

function onMove(e)
{
	let cvleft = canvas.getBoundingClientRect().left;
	let cvtop = canvas.getBoundingClientRect().top;

	let x = e.clientX - cvleft;
	let y = e.clientY - cvtop;


	if (dragging)
	{
		dragging.forEach((obj) =>
			{
				obj.x = x + obj.dragx;
				obj.y = y + obj.dragy;
			});
		redraw();
	}
}

function onUp(e)
{
	dragging = [];
	redraw();
}


function genBox(name,x,y,w,h)
{
	let box = {
		type: "box",
		name: name,
		x: x,
		y: y,
		w: w,
		h: h,
		children: [],
		childOffset: 0,
		addChild: (cname) => {
			box.childOffset += box.h;
			let cbox = {
				type: "box",
				name: cname,
				x: box.x,
				y: box.y + box.childOffset,
				w: box.w,
				h: box.h,
				parent_: name
			};
			box.children.push(cbox);
			objects.push(cbox);
			return cbox;
		}
	};
	objects.push(box);
	return box;
}

function genArrow(from,to)
{
	let arrow = {
		type: "arrow",
		from: from,
		to: to
	};
	objects.push(arrow);
	return arrow;
}


function redraw()
{
	context.beginPath();
	context.clearRect(0, 0, canvas.width, canvas.height);

	objects.forEach((obj) =>
	{
		if ("box" == obj.type)
		{
			context.fillStyle = "#ffffff";
			context.fillText(obj.name, obj.x, obj.y + obj.h/2);
			if (obj.parent_)
			{
				pobj = objects.find((obji) => ("box" == obji.type) && (obj.parent_ == obji.name));
				context.strokeStyle = "#aaaaaa";
				context.strokeRect(obj.x, obj.y, obj.w, obj.h);
			}
			else
			{
				context.strokeStyle = "#ffffff";
				context.strokeRect(obj.x, obj.y, obj.w, obj.h);
			}
		}
		else if ("arrow" == obj.type)
		{
			fobj = objects.find((obji) => ("box" == obji.type) && (obj.from == obji.name));
			tobj = objects.find((obji) => ("box" == obji.type && obj.to == obji.name));
			if (fobj && tobj)
			{
				context.moveTo(fobj.x, fobj.y + fobj.h / 2);
				context.lineTo(tobj.x + tobj.w, tobj.y + tobj.h/2);
				context.arc(tobj.x + tobj.w, tobj.y + tobj.h/2, 3, 0, Math.PI * 2, true);
				context.strokeStyle = "#6666cc";
				context.lineWidth = 1;
				context.stroke();
			}
		}
	});
}
