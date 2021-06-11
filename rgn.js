/*     Rede Geodésica Nacional

Aluno 1: ?number ?name <-- mandatory to fill
Aluno 2: ?number ?name <-- mandatory to fill

Comentario:

O ficheiro "rng.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789

HTML DOM documentation: https://www.w3schools.com/js/js_htmldom.asp
Leaflet documentation: https://leafletjs.com/reference-1.7.1.html
*/



/* GLOBAL CONSTANTS */

const MAP_CENTRE =
	[38.661,-9.2044];  // FCT coordinates
const MAP_ID =
	"mapid";
const MAP_ATTRIBUTION =
	'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
	+ 'contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
const MAP_URL =
	'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='
	+ 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
const MAP_ERROR =
	"https://upload.wikimedia.org/wikipedia/commons/e/e0/SNice.svg";
const MAP_LAYERS =
	["streets-v11", "outdoors-v11", "light-v10", "dark-v10", "satellite-v9",
		"satellite-streets-v11", "navigation-day-v1", "navigation-night-v1"]
const RESOURCES_DIR =
	"resources/";
const VG_ORDERS =
	["order1", "order2", "order3", "order4"];
const RGN_FILE_NAME =
	"rgn.xml";

const VG_TYPE_COUNT = 4;


/* GLOBAL VARIABLES */

let map = null;



/* USEFUL FUNCTIONS */

// Capitalize the first letter of a string.
function capitalize(str)
{
	return str.length > 0
			? str[0].toUpperCase() + str.slice(1)
			: str;
}

// Distance in km between to pairs of coordinates over the earth's surface.
// https://en.wikipedia.org/wiki/Haversine_formula
function haversine(lat1, lon1, lat2, lon2)
{
    function toRad(deg) { return deg * 3.1415926535898 / 180.0; }
    let dLat = toRad(lat2 - lat1), dLon = toRad (lon2 - lon1);
    let sa = Math.sin(dLat / 2.0), so = Math.sin(dLon / 2.0);
    let a = sa * sa + so * so * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
    return 6372.8 * 2.0 * Math.asin (Math.sqrt(a))
}

function loadXMLDoc(filename)
{
	let xhttp = new XMLHttpRequest();
	xhttp.open("GET", filename, false);
	try {
		xhttp.open("GET",
			"http://ctp.di.fct.unl.pt/miei/lap/projs/proj2021-3/resources/rgn.xml",
			false);
		xhttp.send();
	} catch (err) {
		alert("Could not access the local geocaching database via AJAX.\n"
			+ "Therefore, no POIs will be visible.\n");
	}
	return xhttp.responseXML;
}

function getAllValuesByTagName(xml, name)  {
	return xml.getElementsByTagName(name);
}

function getFirstValueByTagName(xml, name)  {
	return getAllValuesByTagName(xml, name)[0].childNodes[0].nodeValue;
}


/* POI */

class POI {
	constructor(xml, map) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");

		this.map = map;
		this.marker = L.circle([this.latitude, this.longitude],
			50,
			{color: 'red', fillColor: 'pink', fillOpacity: 0.4}
		).bindTooltip("This is the POI <b>"+this.name+"</b>");

		this.shown = false;
	}

	/* Mostra o POI no mapa */
	show() {
		if (!this.map.lmap.hasLayer(this.marker)) {
			this.marker.addTo(this.map.lmap);
			this.shown = true;
		}

	}

	/* Esconde o POI */
	hide() {
		this.map.lmap.removeLayer(this.marker);
		this.shown = false;
	}
}

class VG extends POI {
	constructor(xml, map) {
		super(xml, map);
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");

		this.map = map;
		this.marker = L.marker([this.latitude, this.longitude], {icon: map.icons['order'+this.order]});
		this.marker.bindPopup("I'm the marker of VG <b>" + this.name + "</b>.<br>"+
							"Lat: "+this.latitude+"<br>"+
							"Lng: "+this.longitude+"<br>"+
							"Order: "+this.order+"<br>"+
							"Altitude: "+this.altitude+"<br>"+
							"Type: "+this.type+"<br>"+
							"<input type='button' value='VGs Same Type' onclick='vgSameOrder("+ this.order +");'><br>"+
							"<input type='button', value='Show On Street View' onclick='openGoogleStreetView("+this.latitude+", "+this.longitude+")'>")
				.bindTooltip(this.name)
	}
}

class VG1 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 30;
		this.MAX_DISTANCE = 60;
	}

	verify(vg) {
		let distance = haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
		return distance <= this.MAX_DISTANCE && distance >= this.MIN_DISTANCE;
	}
}

class VG2 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 20;
		this.MAX_DISTANCE = 30;
	}

	verify(vg) {
		let distance = haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
		return distance <= this.MAX_DISTANCE && distance >= this.MIN_DISTANCE;
	}
}

class VG3 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 5;
		this.MAX_DISTANCE = 30;
	}

	verify(vg) {
		let distance = haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
		return distance <= this.MAX_DISTANCE && distance >= this.MIN_DISTANCE;
	}
}

class VG4 extends VG {
	constructor(xml, map) {
		super(xml, map);
	}

	verify(vg) {
		return true;
	}
}

class VGCollection {
	constructor(map) {
		this.map = map;
		this.vgs = []; // Lista de listas de VGs
		this.vgs_count = [];
		this.shown_vgs = 0;
		this.lower_vg = null;
		this.circleArray = [];
	}

	addVG(vg) {
		if (!(vg instanceof VG)) {
			vg.show();
			return;
		}

		if (this.vgs[vg.order] == undefined)
			this.vgs[vg.order] = [];
		this.vgs[vg.order].push(vg);
	}

	/* Mostra VGs de uma determinada ordem */
	showOrder(order) {
		for(let i = 0; i < this.vgs[order].length; i++) {
			this.vgs[order][i].show();

			this.shown_vgs++;
			if (this.vgs_count[order] == undefined)
				this.vgs_count[order] = 0;
			this.vgs_count[order]++;
		}
		this.updateStatistics();
	}

	/* Esconde VGs de uma determinada ordem */
	hideOrder(order) {
		for(let i = 0; i < this.vgs[order].length; i++) {
			this.vgs[order][i].hide();
			this.shown_vgs--;
			if (this.vgs_count[order] == undefined)
				this.vgs_count[order] = 0;
			this.vgs_count[order]--;
		}
		this.updateStatistics();
	}

	higherVG() {
		let auxVG = null;
		for (let i=0; i<this.vgs.length; i++) {
			if (this.vgs[i] == undefined)
				continue;
			for (let j=0; j<this.vgs[i].length; j++) {
				if (auxVG == null && this.vgs[i][j].shown)
					auxVG = this.vgs[i][j];
				else {
					if (this.vgs[i][j].altitude != "ND" &&
						this.vgs[i][j].shown &&
						parseFloat(this.vgs[i][j].altitude) > parseFloat(auxVG.altitude)
					)
						auxVG = this.vgs[i][j];
				}
			}
		}
		return auxVG;
	}

	lowerVG() {
		let auxVG = null;
		for (let i=0; i<this.vgs.length; i++) {
			if (this.vgs[i] == undefined)
				continue;
			for (let j=0; j<this.vgs[i].length; j++) {
				if (auxVG == null && this.vgs[i][j].shown)
					auxVG = this.vgs[i][j];
				else {
					if (this.vgs[i][j].altitude != "ND" &&
						this.vgs[i][j].shown &&
						parseFloat(this.vgs[i][j].altitude) < parseFloat(auxVG.altitude)
					)
						auxVG = this.vgs[i][j];
				}
			}
		}
		return auxVG;
	}

	showAltitudes() {
		for (let i=1; i<=this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				if (this.vgs[i][j].shown && this.vgs[i][j].altitude != "ND") {
					let circle = this.map.addCircle([this.vgs[i][j].latitude, this.vgs[i][j].longitude], parseInt(this.vgs[i][j].altitude));
					circle.addTo(this.map.lmap);
					this.circleArray.push(circle);
				}
			}
		}
	}

	removeCircles() {
		for(let i = 0; i < this.circleArray.length; i++) {
			this.map.lmap.removeLayer(this.circleArray[i]);
		}
	}

	showVGSSameOrder(order) {
		for (let i=0; i<this.vgs[order].length; i++) {
			let circle = this.map.addCircle([this.vgs[order][i].latitude, this.vgs[order][i].longitude], 200);
			circle.addTo(this.map.lmap);
			this.circleArray.push(circle);
		}
	}

	verifyVGS() {
		let invalid = []
		let isInvalid = false;
		for (let i=1; i<=this.vgs.length; i++) {
			if (this.vgs[i] == undefined)
				continue;
			for (let j=0; j<this.vgs[i].length; j++) {
				let vgj = this.vgs[i][j];

				for (let k=j+1; k<this.vgs[i].length; k++) {
					let vgk = this.vgs[i][k];
					if (!vgj.verify(vgk)) {
						invalid.push(vgk.name);
						isInvalid = true;
						let circle = this.map.addCircle([this.vgs[i][k].latitude, this.vgs[i][k].longitude], 200);
						circle.addTo(this.map.lmap);
						this.circleArray.push(circle);
					}
				}
				if (isInvalid)
					invalid.push(vgj.name);
			}
		}
		alert(invalid);

		//|1|2|3|2|5|7|1|5|2|


	}

	/* Faz update das estatísticas da página */
	updateStatistics() {
		document.getElementById("visible_caches").innerText = this.shown_vgs;

		// Update das estatísticas dos totais parciais
		for (let i=1; i<this.vgs_count.length; i++) {
			if (this.vgs_count[i] == undefined)
				document.getElementById("visible_caches_order"+i).innerText = 0;
			else
				document.getElementById("visible_caches_order"+i).innerText = this.vgs_count[i];
		}

		let hVG = this.higherVG();
		let lVG = this.lowerVG();

		// Update higher vg in the statictics section
		if (hVG == null) {
			document.getElementById("higher_vg_name").innerText = "NaN";
			document.getElementById("higher_vg_altitude").innerText = 0;
		} else {
			document.getElementById("higher_vg_name").innerText = hVG.name;
			document.getElementById("higher_vg_altitude").innerText = hVG.altitude;
		}

		// Update lower vg in the statictics section
		if (lVG == null) {
			document.getElementById("lower_vg_name").innerText = "NaN";
			document.getElementById("lower_vg_altitude").innerText = 0;
		} else {
			document.getElementById("lower_vg_name").innerText = lVG.name;
			document.getElementById("lower_vg_altitude").innerText = lVG.altitude;
		}
	}
}


/* MAP */

class Map {
	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID, {zoomControl: false}).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);
		this.icons = this.loadIcons(RESOURCES_DIR);
		this.vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME);
		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
		);
		this.addClickHandlerNoReturn(e =>
			this.vgs.removeCircles()
		);
		this.shown_vgs = 0;
	}

	makeMapLayer(name, spec) {
		let urlTemplate = MAP_URL;
		let attr = MAP_ATTRIBUTION;
		let errorTileUrl = MAP_ERROR;
		let layer =
			L.tileLayer(urlTemplate, {
					minZoom: 6,
					maxZoom: 19,
					errorTileUrl: errorTileUrl,
					id: spec,
					tileSize: 512,
					zoomOffset: -1,
					attribution: attr
			});
		return layer;
	}

	addBaseLayers(specs) {
		let baseMaps = [];
		for(let i in specs)
			baseMaps[capitalize(specs[i])] =
				this.makeMapLayer(specs[i], "mapbox/" + specs[i]);
		baseMaps[capitalize(specs[0])].addTo(this.lmap);
		L.control.zoom({}).setPosition("topright").addTo(this.lmap);
		L.control.scale({maxWidth: 150, metric: true, imperial: false})
									.setPosition("topright").addTo(this.lmap);
		L.control.layers(baseMaps, {}).setPosition("topright").addTo(this.lmap);
		return baseMaps;
	}

	loadIcons(dir) {
		let icons = [];
		let iconOptions = {
			iconUrl: "??",
			shadowUrl: "??",
			iconSize: [16, 16],
			shadowSize: [16, 16],
			iconAnchor: [8, 8],
			shadowAnchor: [8, 8],
			popupAnchor: [0, -6] // offset the determines where the popup should open
		};
		for(let i = 0 ; i < VG_ORDERS.length ; i++) {
			iconOptions.iconUrl = dir + VG_ORDERS[i] + ".png";
		    icons[VG_ORDERS[i]] = L.icon(iconOptions);
		}
		return icons;
	}

	/* Converte XML em classes de VGs */
	loadRGN(filename) {
		let xmlDoc = loadXMLDoc(filename);
		let xs = getAllValuesByTagName(xmlDoc, "vg");
		let vgs = new VGCollection(this);
		if(xs.length == 0)
			alert("Empty file");
		else {
			for(let i = 0 ; i < xs.length ; i++) {
				let vg = null;
				let order = getFirstValueByTagName(xs[i], "order");

				switch (order) {
					case '1':
						vg = new VG1(xs[i], this);
						break;
					case '2':
				  		vg = new VG2(xs[i], this);
						break;
					case '3':
				  		vg = new VG3(xs[i], this);
						break;
					case '4':
				  		vg = new VG4(xs[i], this);
						break;
					default:
						vg = new POI(xs[i], this)
				}
				vgs.addVG(vg);
			}
		}
		return vgs;
	}

	addClickHandler(handler) {
		let m = this.lmap; // Esta linha tem de estar aqui, o m em handler2 não consegue reconhecer o this.lmap
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	addClickHandlerNoReturn(handler) {
		function handler2(e) {
			return handler(e);
		}
		return this.lmap.on('click', handler2);
	}

	addCircle(pos, radius, popup) {
		let circle =
			L.circle(pos,
				radius,
				{color: 'red', fillColor: 'pink', fillOpacity: 0.4}
			);
		circle.addTo(this.lmap);
		if( popup != "" )
			circle.bindPopup(popup);
		return circle;
	}
}

/* FUNCTIONS for HTML */

function help() {

}

function help2() {

}

function checkboxUpdate(checkbox) {
	map.vgs.removeCircles();

	if(checkbox.checked)
	 	map.vgs.showOrder(checkbox.id[5]);
	else {
		map.vgs.hideOrder(checkbox.id[5]);
	}
}

function showAltitudeButton() {
	map.vgs.showAltitudes();
}

/* Shows all the VGs of the same order*/
function vgSameOrder(order) {
	map.vgs.showVGSSameOrder(order);
}

function verifyVGSButton() {
	map.vgs.verifyVGS();
}

function openGoogleStreetView(lat, lng) {
	alert(lat+lng)
	document.location = "http://maps.google.com/maps?q=&layer=c&cbll="+lat+","+lng;
}

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100, "FCT/UNL");

	// Update checkbox objects
	for (let i=1; i<=VG_TYPE_COUNT; i++)
		if (document.getElementById("order"+i).checked)
			map.vgs.showOrder(i);
}

function showControlBar() {
	document.getElementById('controlBar').style.display = 'block';
	document.getElementById('controlBarSmall').style.display = 'none';

}

function hideControlBar() {
	document.getElementById('controlBar').style.display = 'none';
	document.getElementById('controlBarSmall').style.display = 'flex';
}
