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
	constructor(xml) {
		this.name = getFirstValueByTagName(xml, "name");
		this.latitude = getFirstValueByTagName(xml, "latitude");
		this.longitude = getFirstValueByTagName(xml, "longitude");
	}
}

class VG extends POI {
	constructor(xml, map, icons) {
		super(xml);
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");

		this.map = map;
		this.marker = L.marker([this.latitude, this.longitude], {icon: icons['order'+this.order]});
		this.marker.bindPopup("I'm the marker of VG <b>" + this.name + "</b>.<br>"+
							"Lat: "+this.latitude+"<br>"+
							"Lng: "+this.longitude+"<br>"+
							"Order: "+this.order+"<br>"+
							"Altitude: "+this.altitude+"<br>"+
							"Type: "+this.type)
				.bindTooltip(this.name)
	}

	show() {
		if (!this.map.hasLayer(this.marker))
			this.marker.addTo(this.map);
	}

	hide() {
		this.map.removeLayer(this.marker);
	}
}

class VG1 extends VG {
	constructor(xml, map, icons) {
		super(xml, map, icons);
	}
}

class VG2 extends VG {
	constructor(xml, map, icons) {
		super(xml, map, icons);
	}
}

class VG3 extends VG {
	constructor(xml, map, icons) {
		super(xml, map, icons);
	}
}

class VG4 extends VG {
	constructor(xml, map, icons) {
		super(xml, map, icons);
	}
}

class VGCollection {
	constructor() {
		this.vgs = []; // Lista de listas de VGs
		this.vgs_count = [];
		this.shown_vgs = 0
	}

	addVG(vg) {
		if (this.vgs[vg.order] == undefined)
			this.vgs[vg.order] = [];
		this.vgs[vg.order].push(vg)
	}

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

	updateStatistics() {
		document.getElementById("visible_caches").innerText = this.shown_vgs;

		for (let i=1; i<this.vgs_count.length; i++) {
			if (this.vgs_count[i] == undefined)
				document.getElementById("visible_caches_order"+i).innerText = 0;
			else
				document.getElementById("visible_caches_order"+i).innerText = this.vgs_count[i];
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
		let vgs = new VGCollection();
		if(xs.length == 0)
			alert("Empty file");
		else {
			for(let i = 0 ; i < xs.length ; i++) {
				let vg = null;
				let order = getFirstValueByTagName(xs[i], "order");

				switch (order) {
					case '1':
						vg = new VG1(xs[i], this.lmap, this.icons);
						break;
					case '2':
				  		vg = new VG2(xs[i], this.lmap, this.icons);
						break;
					case '3':
				  		vg = new VG3(xs[i], this.lmap, this.icons);
						break;
					case '4':
				  		vg = new VG4(xs[i], this.lmap, this.icons);
						break;

				}
				vgs.addVG(vg);
			}
		}
		return vgs;
	}

	addClickHandler(handler) {
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
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
	if(checkbox.checked)
	 	map.vgs.showOrder(checkbox.id[5]);
	else {
		map.vgs.hideOrder(checkbox.id[5]);
	}
}

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.addCircle(MAP_CENTRE, 100, "FCT/UNL");

	// Update checkbox objects
	for (let i=1; i<VG_TYPE_COUNT; i++)
		if (document.getElementById("order"+i).checked)
			map.vgs.showOrder(i);

}
