(function() {
	function rgb2hex(c) {
		return (
			(0x100 | Math.round(c.r)).toString(16).substr(1) +
			(0x100 | Math.round(c.g)).toString(16).substr(1) +
			(0x100 | Math.round(c.b)).toString(16).substr(1)
		);
	}

	function rgb2hsv(c) {
		var r = c.r / 255.0;
		var g = c.g / 255.0;
		var b = c.b / 255.0;
		var max = r > g ? r : g;
		max = max > b ? max : b;
		var min = r < g ? r : g;
		min = min < b ? min : b;
		var h = max - min;
		if (h > 0.0) {
			if (max == r) {
				h = (g - b) / h;
				if (h < 0.0) {
					h += 6.0;
				}
			} else if (max == g) {
				h = 2.0 + (b - r) / h;
			} else {
				h = 4.0 + (r - g) / h;
			}
		}
		h /= 6.0;
		var s = (max - min);
		if (max != 0.0)
			s /= max;
		var v = max;
		return {
			h: h,
			s: s,
			v: v,
		}
	}

	function key2rgb(key) {
		var c = key.split(',');
		return {
			r: parseInt(c[0]),
			g: parseInt(c[1]),
			b: parseInt(c[2])
		}
	}

	function mix(lc0, lc1) {
		var c0 = lc0.rgb;
		var c1 = lc1.rgb;
		var p = (lc0.v + lc1.v);
		var r = parseInt(Math.round((c0.r * lc0.v + c1.r * lc1.v) / p));
		var g = parseInt(Math.round((c0.g * lc0.v + c1.g * lc1.v) / p));
		var b = parseInt(Math.round((c0.b * lc0.v + c1.b * lc1.v) / p));
		var key = r + ',' + g + ',' + b;
		var obj = {}
		obj.key = key;
		obj.v = p;
		obj.rgb = key2rgb(obj.key);
		obj.hsv = rgb2hsv(obj.rgb);
		return obj;
	}

	function sortRgb(b, a) {
		var dr = a.rgb.r - b.rgb.r;
		var dg = a.rgb.g - b.rgb.g;
		var db = a.rgb.b - b.rgb.b;
		return (dr != 0.0) ? dr : (dg != 0.0) ? dg : db;
	}

	function sortGbr(b, a) {
		var dr = a.rgb.r - b.rgb.r;
		var dg = a.rgb.g - b.rgb.g;
		var db = a.rgb.b - b.rgb.b;
		return (dg != 0.0) ? dg : (db != 0.0) ? db : dr;
	}

	function sortBrg(b, a) {
		var dr = a.rgb.r - b.rgb.r;
		var dg = a.rgb.g - b.rgb.g;
		var db = a.rgb.b - b.rgb.b;
		return (db != 0.0) ? db : (dr != 0.0) ? dr : db;
	}

	function sortHvs(a, b) {
		var dh = a.hsv.h - b.hsv.h;
		var dv = a.hsv.v - b.hsv.v;
		var ds = a.hsv.s - b.hsv.s;
		return (dh != 0.0) ? dh : (dv != 0.0) ? dv : ds;
	}

	function sortVsh(a, b) {
		var dh = a.hsv.h - b.hsv.h;
		var dv = a.hsv.v - b.hsv.v;
		var ds = a.hsv.s - b.hsv.s;
		return (dv != 0.0) ? dv : (ds != 0.0) ? ds : dh;
	}

	function sortShv(a, b) {
		var dh = a.hsv.h - b.hsv.h;
		var dv = a.hsv.v - b.hsv.v;
		var ds = a.hsv.s - b.hsv.s;
		return (ds != 0.0) ? ds : (dh != 0.0) ? dh : dv;
	}

	function lrgb(o0, o1) {
		var dr = o0.rgb.r - o1.rgb.r;
		var dg = o0.rgb.g - o1.rgb.g;
		var db = o0.rgb.b - o1.rgb.b;
		return dr * dr + dg * dg + db * db;
	}

	function lhsv(o0, o1) {
		var dv = o0.hsv.v - o1.hsv.v;
		var ds = o0.hsv.s - o1.hsv.s;
		var dh = Math.abs(o0.hsv.h - o1.hsv.h);
		dh = (dh > 0.5) ? 1.0 - dh : dh;
		return dv * dv + ds * ds + dh * dh;
	}

	function reduce(objs, eps, len) {
		var ret = [];
		var lastobj = objs[0];
		for (var i = 1; i < objs.length; i++) {
			var o0 = lastobj;
			var o1 = objs[i];
			var l = len(o0, o1);
			if (l < eps) {
				lastobj = mix(lastobj, o1);
			} else {
				ret.push(lastobj);
				lastobj = o1;
			}
		}
		ret.push(lastobj);
		return ret;
	}

	function calcColors(imageData) {
		var d = imageData.data;
		var l = {};
		for (var i = 0; i < d.length; i += 4) {
			if (d[i + 3] != 255)
				continue;
			var key = d[i + 0] + ',' + d[i + 1] + ',' + d[i + 2];
			var n = l[key];
			l[key] = (n) ? n + 1 : 1;
		}
		var objs = [];
		var keys = Object.keys(l);
		for (var i = 0; i < keys.length; i++) {
			var obj = {};
			obj.key = keys[i];
			obj.v = l[obj.key];
			obj.rgb = key2rgb(obj.key);
			obj.hsv = rgb2hsv(obj.rgb);
			objs.push(obj);
		}
		for (var j = 0; objs.length > 10; j++) {
			var eps = 3.0 * Math.tanh((j + 1) * 1E-5);
			var sorter = [sortHvs, sortVsh, sortShv];
			for (var i = 0; i < sorter.length; i++) {
				objs = objs.sort(sorter[i]);
				objs = reduce(objs, eps, lhsv);
				if (objs.length < 10) break;
			}
			var eps = j * j
			var sorter = [sortRgb, sortGbr, sortBrg];
			for (var i = 0; i < sorter.length; i++) {
				objs = objs.sort(sorter[i]);
				objs = reduce(objs, eps, lrgb);
				if (objs.length < 10) break;
			}
		}
		objs = objs.sort(function(a, b) {
			return b.v - a.v;
		});

		var n = objs.length;
		var sum = 0;
		for (var i = 0; i < n; i++) {
			sum += objs[i].v;
		}
		var m = n;
		var ret = [];
		for (var i = 0; i < n; i++) {
			if (objs[i].v / sum < 0.01) {
				m = i;
				break;
			}
			ret.push(objs[i]);
		}
		return ret;
	}

	function createTable(elem, colors, flag) {
		var table = document.createElement('table');
		elem.appendChild(table);
		table.style.fontSize = 'xx-small';
		table.setAttribute('border', 0);
		var w = elem.offsetWidth;
		var h = elem.offsetHeight;
		table.setAttribute('data-height', h);
		table.style.width = w;
		if (flag) {
			table.style.display = 'none';
			table.setAttribute('id', 'drawColorPallet_table2');
			table.style.height = h / 2;
		} else {
			table.style.display = 'block';
			table.setAttribute('id', 'drawColorPallet_table1');
			table.style.height = h;
		}
		var sum = 0;
		for (var i = 0; i < colors.length; i++)
			sum += colors[i].v;
		var html = '<tr>';
		for (var i = 0; i < colors.length; i++) {
			var c = colors[i];
			var p = (c.v / sum);
			html += '<td  style="'
			html += 'background-color:rgb(' + c.key + ');';
			html += 'color:' + ((c.hsv.v < 0.82) ? 'white' : 'black') + ';';
			html += 'text-align: center;';
			html += 'overflow: hidden;';
			html += 'height:' + table.style.height + ';';
			if (flag) {
				html += 'width:' + (w / colors.length) + 'px;';
				html += '">';
				html += c.key;
				html += '<br>#' + rgb2hex(c.rgb);
				html += '<br>about ' + parseInt(Math.round(p * 100.0)) + '%';
			} else {
				html += 'width:' + (w * p) + 'px;';
				html += '">';
			}
			html += '</td>';
		}
		table.innerHTML = html + '</tr>';
		return table;
	}

	function paintPallet(colors, elem) {
		var tables = elem.getElementsByTagName('table');
		while (tables.length > 0)
			elem.removeChild(tables[0]);
		createTable(elem, colors, false).onclick = function(e) {
			var table = document.getElementById('drawColorPallet_table2');
			var h = parseInt(this.getAttribute('data-height'));
			if (table.style.display == 'none') {
				table.style.display = 'block';
				table.style.height = h / 2;
				this.style.height = h / 2;
			} else {
				table.style.display = 'none';
				this.style.height = h;
			}
		};
		createTable(elem, colors, true);
	}

	window.drawColorPallet = function drawColorPallet(src, elem, afterDraw) {
		var img = new Image();
		img.onload = function complete() {
			var c1 = document.createElement('canvas');
			var ctx = c1.getContext('2d');
			var w = this.width;
			var h = this.height;
			c1.setAttribute('width', w);
			c1.setAttribute('height', h);
			ctx.drawImage(img, 0, 0);
			var imageData = ctx.getImageData(0, 0, w, h);
			var colors = calcColors(imageData);
			paintPallet(colors, elem);
			if (afterDraw) {
				afterDraw();
			}
		};
		img.src = src;
	}
})();
