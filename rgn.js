/*     Rede Geodésica Nacional

Aluno 1: 57882 Luis Tripa <-- mandatory to fill
Aluno 2: 57706 Raquel Melo <-- mandatory to fill

Comentario:
Implementámos soluções para todos os requisitos.
Algumas funções têm breves comenários a explicar o que devem fazer.

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

	/*
	Mostra o POI se ele ainda não estiver visível
	*/
	show() {
		if (!this.map.marker_cluster.hasLayer(this.marker)) {
			this.marker.addTo(this.map.marker_cluster);
			this.shown = true;
		}
	}

	/*
	Esconde o POI
	*/
	hide() {
		this.map.marker_cluster.removeLayer(this.marker);
		this.shown = false;
	}

	/*
	Faz update do popup do VG para atualizar as informações nele contidas
	*/
	refreshPopup() {
		// Função requer implementação (precisa de ser definida numa subclasse)
	}
}

class VG extends POI {
	constructor(xml, map) {
		super(xml, map);
		this.order = getFirstValueByTagName(xml, "order");
		this.altitude = getFirstValueByTagName(xml, "altitude");
		this.type = getFirstValueByTagName(xml, "type");

		this.map = map;
		this.marker = L.marker([this.latitude, this.longitude],
								{icon: map.icons['order'+this.order]});
		this.marker.bindPopup("I'm the marker of VG <b>" + this.name + "</b>.<br>"+
			"Lat: "+this.latitude+"<br>"+
			"Lng: "+this.longitude+"<br>"+
			"Order: "+this.order+"<br>"+
			"Altitude: "+this.altitude+"<br>"+
			"Type: "+this.type+"<br>"+
			"<input type='button' value='VGs Same Type' "+
				"onclick='vgSameType(&quot;"+this.type+"&quot;)'><br>"+
			"<input type='button' value='Show On Street View'"+
			"onclick='openGoogleStreetView("+this.latitude+", "+this.longitude+")'>")
			.bindTooltip(this.name)
	}

	/*
	Verifica se a distância entre este VG e o vg passado cumprem as distâncias experadas.
	*/
	verify(vg) {
		// Função requer implementação (precisa de ser definida numa subclasse)
		return true;
	}

	/*
	Mostra no nome dos VGs em vez de 'object Object' quando se faz prints
	de listas com este elemento.
	*/
	toString() {
		return this.name;
	}
}

class VG1 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 30; // km
		this.MAX_DISTANCE = 60; // km
	}

	verify(vg) {
		let distance = haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
		return distance <= this.MAX_DISTANCE && distance >= this.MIN_DISTANCE;
	}

	refreshPopup() {
		let popup = this.marker.getPopup();
		popup.setContent(popup.getContent()+
			"<br>Total VGs under or equal to 60 km away: "+
			this.map.vgs.numVGSDistLowerOrEqualTo(this.latitude, this.longitude, 60))
	}

}

class VG2 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 20; // km
		this.MAX_DISTANCE = 30; // km
		let popup = this.marker.getPopup();
		popup.setContent(popup.getContent() + "<br><input type='button'"+
			"value='Same Order Under 30km'"+
			"onclick='processCircleVGSUnderDist("
				+this.latitude+","+this.longitude+","+this.order+",30"+
			")'>");
	}

	verify(vg) {
		let distance = haversine(this.latitude, this.longitude, vg.latitude, vg.longitude);
		return distance <= this.MAX_DISTANCE && distance >= this.MIN_DISTANCE;
	}
}

class VG3 extends VG {
	constructor(xml, map) {
		super(xml, map);

		this.MIN_DISTANCE = 5; // km
		this.MAX_DISTANCE = 30; // km
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
		this.vgs = []; // Lista de listas de VGs (ordenados por ordem; cada ordem em uma lista)
		this.vgs_count = []; // Armazena os totais parciais de cada ordem de VGs
		this.circleArray = [];
	}

	/*
	Dá update de todos os popups para atualizar a informação neles contida
	Esta função serve unicamente para os VGs de ordem 1 que têm informações dinâmicas no seu popup.
	A função só deve ser chamada no inicio do programa.
	*/
	refreshPopups() {
		for (let i=1; i<this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				this.vgs[i][j].refreshPopup();
			}
		}
	}

	/*
	Adiciona um objeto à coleção de objetos.
	Se o objeto for um VG, é adicionado a uma lista de listas que contém os VGs de cada ordem.
	Se o objeto não fôr um VG, mostra-se simplesmente o objeto sem se adicionar à lista.
	Mesmo não sendo um VG, um objeto continua a ser agrupado nos clusters
	*/
	addVG(vg) {
		if (!(vg instanceof VG)) {
			vg.show();
			return;

		} else {
			if (vg.order != undefined) {
				if (this.vgs[vg.order] == undefined)
					this.vgs[vg.order] = [];
				this.vgs[vg.order].push(vg);
			}
		}
	}

	/*
	Mostra VGs de uma determinada ordem
	*/
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

	/*
	Esconde VGs de uma determinada ordem
	*/
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

	/*
	Obtém o VG mais alto da coleção que está a ser exibido.
	Para ser o mais alto tem de:
		- Estar visível
		- A altitude não pode ser 'ND'
		- Não pode haver outro VG com uma altura maior
	Notas:
		- Assume-se que quando existem VGs de altura igual, retorna-se o primeiro que se encontrou
	*/
	higherVG() {
		let auxVG = null;
		for (let i=1; i<this.vgs.length; i++) {
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

	/*
	Obtém o VG mais baixo da coleção que está a ser exibido.
	Para ser o mais baixo tem de:
		- Estar visível
		- A altitude não pode ser 'ND'
		- Não pode haver outro VG com uma altura menor
	Notas:
		- Assume-se que quando existem VGs de altura igual, retorna-se o primeiro que se encontrou
	*/
	lowerVG() {
		let auxVG = null;
		for (let i=1; i<this.vgs.length; i++) {
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

	/*
	Mostra as altitudes dos diversos VGs através de circulos com tamanhos porporcionais à altitude
	nas coordenadas dos VGs
	Notas:
		- Não se mostram circulos se a altitude fôr 'ND'
	*/
	showAltitudes() {
		for (let i=1; i<this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				let vgi = this.vgs[i][j];
				if (vgi.shown && vgi.altitude != "ND") {
					let circle = this.map.createCircle(
						[vgi.latitude, vgi.longitude],
						parseFloat(vgi.altitude*3),
					);
					circle.setStyle({color: "blue", fillColor: "pink"});
					circle.addTo(this.map.lmap);
					this.circleArray.push(circle);
				}
			}
		}
	}

	/*
	Remove todos os circulos que se encontram no mapa.
	Esta função é chamada quando:
		- Se escolhem outro tipo de VGs para mostrar
		- Se escondem VGs
		- Se carrega no botão de mostrar as altitudes
		- Se carrega no mapa fora de uma VG ou circulo
	*/
	removeCircles() {
		for(let i = 0; i < this.circleArray.length; i++) {
			this.map.lmap.removeLayer(this.circleArray[i]);
	   }
	}

	/*
	Mostra os VGs do mesmo tipo.
	Esta função desenha um pequeno circulo nas posições dos VGs do tipo que se pretende
	*/
	showVGSSameType(type) {
		for (let i=1; i<this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				let vgi = this.vgs[i][j];
				if (vgi.type == type) {
					let circle = this.map.createCircle([vgi.latitude, vgi.longitude], 300);
					circle.setStyle({color: "green", fillColor: "pink"});
					circle.addTo(this.map.lmap);
					this.circleArray.push(circle);
				}
			}
		}
	}

	/*
	Verifica as distancias de todos os VGs.
	Tem de existir pelo menos um VG que respeite as regras, para o VG ser válido.
	No caso de as distâncias não serem respeitadas, os VGs que não respeitam são listados num alerta
	*/
	verifyVGS() {
		let invalid = []
		let isInvalid = true;
		for (let i=1; i<this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				let vgj = this.vgs[i][j];
				for (let k=j+1; k<this.vgs[i].length; k++) {
					let vgk = this.vgs[i][k];
					if (vgj.verify(vgk)) {
						isInvalid = false;
						break;
					}
				}

				if (isInvalid)
					invalid.push(vgj.name);
			}
		}
		if (invalid.length > 0)
			alert("Invalidos: "+invalid);
		else
			alert("Todos os VGs são válidos.");
	}

	numVGSDistLowerOrEqualTo(latitude, longitude, dist) {
		let numVGS = 0;
		for(let i=1; i<this.vgs.length; i++) {

			numVGS += this.vgsDistLowerOrEqualTo(latitude, longitude, i, dist).length;
		}
		return numVGS;
	}

	/*
	Lista todos os VGs de uma determinada ordem que se encontram a uma distancia dist do
	ponto de coordenadas [latitude, longitude]
	*/
	vgsDistLowerOrEqualTo(latitude, longitude, order, dist){
		let vgs_inside = [];
		for (let i=0; i<this.vgs[order].length; i++) {
			let vgi = this.vgs[order][i];
			if (latitude != vgi.latitude && longitude != vgi.longitude) {
				if(haversine(latitude, longitude, vgi.latitude, vgi.longitude) <= dist)
					vgs_inside.push(vgi);
			}
		}
		return vgs_inside;
	}

	/*
	Circunda todos os VGs de uma determinada ordem que se encontram a uma distancia dist do
	ponto de coordenadas [latitude, longitude]
	*/
	circleVGSDistLowerOrEqualTo(latitude, longitude, order, dist) {
		let vgs_aux = this.vgsDistLowerOrEqualTo(latitude, longitude, order, dist);

		for (let i=0; i<vgs_aux.length; i++) {
			let vgi = vgs_aux[i];
			let circle = this.map.drawCircle([vgi.latitude, vgi.longitude], 200);
			this.circleArray.push(circle);
		}
	}

	/*
	Faz update das estatísticas da página
	*/
	updateStatistics() {
		let totalShownVGS = 0;
		for (let i=1; i<this.vgs_count.length; i++) {
			if (this.vgs_count != undefined)
				totalShownVGS += this.vgs_count[i];
		}
		document.getElementById("visible_caches").innerText = totalShownVGS;

		// Update das estatísticas dos totais parciais
		for (let i=1; i<this.vgs_count.length; i++) {
			if (this.vgs_count[i] == undefined)
				document.getElementById("visible_caches_order"+i).innerText = 0;
			else
				document.getElementById("visible_caches_order"+i).innerText = this.vgs_count[i];
		}

		let hVG = this.higherVG();
		let lVG = this.lowerVG();

		// Atualiza o VG mais alto
		if (hVG == null) {
			document.getElementById("higher_vg_name").innerText = "NaN";
			document.getElementById("higher_vg_altitude").innerText = 0;
		} else {
			document.getElementById("higher_vg_name").innerText = hVG.name;
			document.getElementById("higher_vg_altitude").innerText = hVG.altitude;
		}

		// Atualiza o VG mais baixo
		if (lVG == null) {
			document.getElementById("lower_vg_name").innerText = "NaN";
			document.getElementById("lower_vg_altitude").innerText = 0;
		} else {
			document.getElementById("lower_vg_name").innerText = lVG.name;
			document.getElementById("lower_vg_altitude").innerText = lVG.altitude;
		}

		// Atualiza a média
		let totalAltitude = 0;
		for (let i=1; i<this.vgs.length; i++) {
			for (let j=0; j<this.vgs[i].length; j++) {
				let vgi = this.vgs[i][j];
				if (vgi.shown) {
					if (vgi.altitude == 'ND')
						totalShownVGS--;
					else
						totalAltitude += parseFloat(vgi.altitude);
				}
			}
		}
		document.getElementById('average_altitude').innerHTML = parseInt(totalAltitude/totalShownVGS);
	}
}


/* MAP */

class Map {
	constructor(center, zoom) {
		this.lmap = L.map(MAP_ID, {zoomControl: false}).setView(center, zoom);
		this.addBaseLayers(MAP_LAYERS);

		this.marker_cluster = L.markerClusterGroup({
			removeOutsideVisibleBounds: true,
		});
		this.lmap.addLayer(this.marker_cluster)

		this.icons = this.loadIcons(RESOURCES_DIR);
		this.vgs = this.loadRGN(RESOURCES_DIR + RGN_FILE_NAME);
		this.vgs.refreshPopups();

		this.addClickHandler(e =>
			L.popup()
			.setLatLng(e.latlng)
			.setContent("You clicked the map at " + e.latlng.toString())
		);
		this.addClickHandlerNoReturn(e => // Remove circulos se se carregar no mapa fora de um VG
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

	/*
	Converte XML em classes de VGs ou POI's
	*/
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
		let m = this.lmap;
		function handler2(e) {
			return handler(e).openOn(m);
		}
		return this.lmap.on('click', handler2);
	}

	/*
	Click handler especial para não adicionar nada ao mapa, isto é,
	não usa a função openOn como na função acima.
	*/
	addClickHandlerNoReturn(handler) {
		function handler2(e) {
			return handler(e);
		}
		return this.lmap.on('click', handler2);
	}

	/*
	Cria um circulo numa dada localização, com um dado raio e
	com popup opcional sem o desenhar no mapa.
	@param pos: Um tuplo contendo a latitude e a longitude
	*/
	createCircle(pos, radius, popup="") {
		let circle =
			L.circle(pos, radius,
					{color: "red", fillColor: "pink", fillOpacity: 0.4})
		if (popup != "")
			circle.bindPopup(popup);
		return circle;
	}

	/*
	Desenha um circulo no mapa numa dada localização, com um dado raio e com popup opcional
	@param pos: Um tuplo contendo a latitude e a longitude
	*/
	drawCircle(pos, radius, popup) {
		let circle = this.createCircle(pos, radius, popup);
		circle.addTo(this.lmap);
		return circle;
	}
}

/* FUNCTIONS for HTML */

function help() {

}

function help2() {

}

/*
Função chamada pelas checkboxes de seleção
*/
function checkboxUpdate(checkbox) {
	map.vgs.removeCircles();

	//checkbox.id[5] é o último caractér dos ids das checkboxes
	if(checkbox.checked)
	 	map.vgs.showOrder(checkbox.id[5]);
	else {
		map.vgs.hideOrder(checkbox.id[5]);
	}
}

/*
Função chamada quando se carrega no botão 'Altitudes'
*/
function showAltitudeButton() {
	map.vgs.removeCircles();
	map.vgs.showAltitudes();
}

/*
Mostra todos os VGs com o mesmo tipo.
Função chamada a partir dos popups dos VGs
*/
function vgSameType(type) {
	map.vgs.removeCircles();
	map.vgs.showVGSSameType(type);
}

/*
Mostra quais os VGs que estão inválidos, lançando uma alerta se existirem.
Função chamada quando se carrega no botão 'Verificar'
*/
function verifyVGSButton() {
	map.vgs.verifyVGS();
}

/*
Abre o street view numa determinada latitude e longitude
*/
function openGoogleStreetView(lat, lng) {
	document.location = "http://maps.google.com/maps?q=&layer=c&cbll="+lat+","+lng;
}

/*
Função de interface entre o botão do popup dos VGs de 1ª ordem que mostra o número
*/
function processCircleVGSUnderDist(lat, lng, order, dist) {
	map.vgs.removeCircles();
	map.vgs.circleVGSDistLowerOrEqualTo(lat, lng, order, dist);
}

function onLoad()
{
	map = new Map(MAP_CENTRE, 12);
	map.drawCircle(MAP_CENTRE, 100, "FCT/UNL");

	// Update checkbox objects
	for (let i=1; i<=VG_TYPE_COUNT; i++)
		if (document.getElementById("order"+i).checked)
			checkboxUpdate(document.getElementById("order"+i));
}


/*
Funções específicas do front-end
*/
function showControlBar() {
	document.getElementById('controlBar').style.display = 'block';
	document.getElementById('controlBarSmall').style.display = 'none';

}

function hideControlBar() {
	document.getElementById('controlBar').style.display = 'none';
	document.getElementById('controlBarSmall').style.display = 'flex';
}
