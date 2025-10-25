// ==UserScript==
// @name         Lista HD en FilmAffinity
// @namespace    http://https://github.com/MarcRoviraP/mis-scripts-filmaffinity
// @version      1.3
// @description  Crea un overlay estilo FilmAffinity para la lista HD
// @author       Marc
// @match        http*://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant GM_addValueChangeListener
// @connect      filmaffinity.com

// ==/UserScript==

let listaHD = JSON.parse(GM_getValue('listaHD', '[]'));
const color1 = "#447CAD";
const color2 = "#F9C700";
const urlPelicula = window.location.href;
const id = urlPelicula.split("/").pop().split(".")[0];

(function () {
    'use strict';

    // Estilo blink
    const style = document.createElement('style');
    style.textContent = `
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .blink {
            animation: blink 0.8s infinite;
        }
    `;
    document.head.appendChild(style);
    // Scraping
    const timestamp = Date.now();

    let time = GM_getValue("time", null);
    if (time === null) {
        GM_setValue("time", timestamp);
        time = timestamp;
    }

    // Comprobar que han pasado 24h
    //    const ONE_DAY = 24 * 60 * 60 * 1000;
    const ONE_DAY = 3600 * 1000;
    if (timestamp - time >= ONE_DAY) {
        console.log("Han pasado 24 horas. Hago algo aquí...");
        comprobarDisponibilidadHD();
        // Actualizamos el valor para que vuelva a contar desde ahora
        GM_setValue("time", timestamp);
    } else {
        console.log("Aún no han pasado 24 horas.");
    }

    if (location.hostname.includes("filmaffinity.com")) {

        // Filmaffinity

        // Tecla ALT+O para mostrar overlay
        document.addEventListener("keydown", function (e) {
            if (e.altKey && e.key.toLowerCase() === "o") {
                e.preventDefault();
                mostrarOverlayHD();
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.altKey && e.key.toLowerCase() === "e") {
                e.preventDefault();
                mostrarOverlayHD2("https://www.filmaffinity.com/es/film811435.html","https://pics.filmaffinity.com/superman-138926671-mmed.jpg","Superman");
            }
        });

        const delDiv = document.querySelector('.add-movie-list-info.add-to-list-button');
        if (delDiv) delDiv.remove();
        // Preparar botón HD en la página
        const targetDiv = document.querySelector('.add-text-content');
        if (targetDiv) {
            const newChild = document.createElement('a');
            newChild.textContent = ' Lista HD en espera';
            newChild.style.color = color1;
            newChild.style.fontWeight = 'bold';
            newChild.style.cursor = 'pointer';
            targetDiv.appendChild(newChild);

            const hdButton = document.createElement('button');
            hdButton.classList.add('hd_button');

            hdButton.style.cssText = `
            background: ${listaHD.some(p => p.id === id) ? color2 : color1};
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            font-size: 20px;
            margin-left: 10px;
        `;
            // Crear un span interno para el texto "HD" y añadir la clase blink
            const hdSpan = document.createElement('span');
            hdSpan.id = 'hdSpan';
            hdSpan.textContent = 'HD';
            if(listaHD.some(p => p.id === id & p.estado === 1)){

                hdSpan.classList.add('blink');

            }
            hdButton.appendChild(hdSpan);
            targetDiv.appendChild(hdButton);

            newChild.addEventListener('click', mostrarOverlayHD);
            hdButton.addEventListener('click', () => toggleFavFilm(hdButton,hdSpan));
        }
    }

})();

// -------------------- FUNCIONES GLOBALES --------------------
async function comprobarDisponibilidadHD() {
    console.log("Películas a comprobar: " + listaHD.length);
    if (listaHD.length === 0) {
        console.log("No es necesario comprobar ahora");
        return;
    }

    console.log('Comprobando disponibilidad HD...');
    const peliculasSinHD = listaHD.filter(peli => peli.estado === 0);
    console.log(`Películas sin HD: ${peliculasSinHD.length}`);

    let cambios = false;

    for (const pelicula of peliculasSinHD) {
        try {
            console.log(`Comprobando: ${pelicula.nombre}`);
            const tieneHD = await comprobarPeliculaHD(pelicula.urlPeli);
            if (tieneHD) {
                pelicula.estado = 1;
                cambios = true;
                console.log(`¡${pelicula.nombre} ahora está en HD!`);

                // Guardar la lista actualizada - esto notificará al script principal
                GM_setValue('listaHD', JSON.stringify(listaHD));

                // Mostrar notificación (solo si estamos en una página activa)
                if (document.visibilityState === 'visible') {
                    mostrarOverlayHD2(pelicula.urlPeli,pelicula.urlImg,pelicula.nombre);

                }
            }

            // Esperar entre comprobaciones para no saturar
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error comprobando ${pelicula.nombre}:`, error);
        }
    }

    if (cambios) {
        console.log("Guardando cambios en la lista");
        GM_setValue('listaHD', JSON.stringify(listaHD));
    } else {
        console.log("No hay cambios en la lista HD");
    }
}

function comprobarPeliculaHD(url) {
    console.log(`Fetching (GM_xmlhttpRequest): ${url}`);
    return new Promise((resolve) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(response) {
                if (response.status !== 200) {
                    console.error(`Error HTTP: ${response.status}`);
                    return resolve(false);
                }

                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");

const tieneHD = doc.querySelector('.film-right-box.vod-wrapper') !== null;
                console.log(`Resultado HD: ${tieneHD}`);
                resolve(tieneHD);
            },
            onerror: function(error) {
                console.error('Error en GM_xmlhttpRequest:', error);
                resolve(false);
            }
        });
    });
}


function guardarLista() {
    GM_setValue('listaHD', JSON.stringify(listaHD));
}

function addFav() {
    const nombre = document.getElementById("main-title").textContent;
    const existe = listaHD.some(peli => peli.nombre === nombre);
    if (existe) return;

    const imagen = document.querySelector('img[itemprop="image"]');
    const url = imagen?.src || '';
    const hd = document.getElementsByClassName('film-right-box vod-wrapper')[0];
    const hdValue = hd ? 1 : 0;

    listaHD.unshift({
        id: id,
        urlImg: url,
        nombre: nombre,
        estado: hdValue,
        urlPeli: urlPelicula
    });
    guardarLista();
}

function borrarPeli(peliId) {
    listaHD = listaHD.filter(peli => peli.id !== peliId);
    guardarLista();
    actualizarOverlay();

    const botonHD = document.getElementsByClassName("hd_button")[0];
    botonHD.style.background = color1;
    const spanHD = document.getElementById("hdSpan");
    spanHD.classList.remove('blink');

}

function toggleFavFilm(button, textSpan) {
    const existe = listaHD.some(p => p.id === id);

    if (existe) {
        borrarPeli(id);
        textSpan.classList.remove('blink');
    } else {
        addFav();
        const peli = listaHD.find(p => p.id === id);
        if (peli && peli.estado === 1) {
            textSpan.classList.add('blink');
            mostrarOverlayHD2(peli.urlPeli,peli.urlImg,peli.nombre);
        }
    }

    button.style.background = listaHD.some(p => p.id === id) ? color2 : color1;
}



// -------------------- OVERLAY --------------------

let overlayGlobal; // para poder actualizarlo desde otras funciones

// -------------------- OVERLAY 1 --------------------
function mostrarOverlayHD() {
    if (overlayGlobal) overlayGlobal.remove();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.8); z-index: 10000;
        display:flex; justify-content:center; align-items:center;
    `;
    overlayGlobal = overlay;

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:10px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;position:relative;">
            <div style="background:${color1};padding:20px;color:white;font-size:22px;font-weight:bold;text-align:center;position:relative;">
                LISTA <span style="color:${color2};">HD</span> DE ESPERA
            </div>
            <div id="listaContainer" style="padding:20px;"></div>
        </div>
    `;
    document.body.appendChild(overlay);
    actualizarOverlay();

    // Cargar todas las imágenes de la lista en base64
    listaHD.forEach(item => {
        const imgEl = overlay.querySelector(`img[src='${item.urlImg}']`);
        if (imgEl) {
            cargarImagenBase64(item.urlImg, (base64) => {
                if (base64) imgEl.src = base64;
            });
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target.matches('.btn-borrar')) borrarPeli(e.target.dataset.id);
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
}

// -------------------- OVERLAY 2 --------------------
function mostrarOverlayHD2(urlPagina, urlImg, title) {
    if (overlayGlobal2) overlayGlobal2.remove();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.8); z-index: 10000;
        display:flex; justify-content:center; align-items:center;
    `;
    overlayGlobal2 = overlay;

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:10px;width:15%;height:auto;overflow-y:auto;position:relative;">
            <div style="background:${color1};padding:20px;color:white;font-size:20px;font-weight:bold;text-align:center;position:relative;">
                NUEVA PELÍCULA EN  <span style="color:${color2};">HD</span>
            </div>
            <a href="${urlPagina}" style="text-decoration:none;">
                <div style="padding:20px;text-align:center;">
                    <img id="imgNuevaHD" style="width:150px;height:auto;display:block;border-radius:10px;margin:0 auto;box-shadow:0 4px 8px rgba(0,0,0,0.2);" alt="Película en HD"/>
                    <h1 style="color:#333;margin:20px 0;font-size:28px;text-align:center;">${title}</h1>
                </div>
            </a>
            <button id="btnOv2" style="background:${color1}; color:white; border:none; padding:12px 30px; font-size:16px; font-weight:bold; border-radius:10px; cursor:pointer; transition:all 0.3s ease; margin:10px auto; display:block;">
                LISTA <span style="color:${color2}">HD</span> DE ESPERA
            </button>
        </div>
    `;
    document.body.appendChild(overlay);

    // Cargar la imagen en base64
    const imgEl = document.getElementById("imgNuevaHD");
    cargarImagenBase64(urlImg, (base64) => { if (base64) imgEl.src = base64; });

    const btn = document.getElementById("btnOv2");
    btn.addEventListener("click", mostrarOverlayHD);

    overlay.addEventListener('click', (e) => {
        if (e.target.matches('.btn-borrar')) borrarPeli(e.target.dataset.id);
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
}


function generarListaHD() {
    return listaHD.map(item => `
        <li style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #eee;gap:10px;">
            <a href="${item.urlPeli}" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex:1;">
                <div style="width:70px;height:104px;overflow:hidden;border-radius:8px;">
                    <img src="${item.urlImg}" width="70" height="104" style="object-fit:cover;" />
                </div>
                <span style="font-size:18px;line-height:1.4;color:${color1};">${item.nombre}</span>
            </a>
            <div style="display:flex;gap:8px;align-items:center;">
                ${item.estado===1 ? `<button data-id="${item.id}" style="background:${color1};border:none;color:white;border-radius:50%;width:35px;height:35px;cursor:pointer;font-size:14px;">
                    <span class="btn-estado blink" style="color:${color2}">HD</span>
                </button>` : `<span></span>`}
                <button class="btn-borrar" data-id="${item.id}" style="background:${color1};border:none;color:white;border-radius:50%;width:35px;height:35px;cursor:pointer;font-size:22px;font-weight:bold;">×</button>
            </div>
        </li>
    `).join('');
}

function actualizarOverlay() {
    if (!overlayGlobal) return;
    const container = overlayGlobal.querySelector('#listaContainer');
    container.innerHTML = listaHD.length === 0
        ? '<div style="text-align:center;padding:40px;color:#666;">No hay películas en la lista HD</div>'
    : `<ul style="list-style:none;padding:0;margin:0;">${generarListaHD()}</ul>`;
}
let overlayGlobal2; // para poder actualizarlo desde otras funciones

// Función auxiliar para cargar imagen en base64
function cargarImagenBase64(url, callback) {
    GM_xmlhttpRequest({
        method: "GET",
        url: url,
        responseType: "blob",
        onload: function(response) {
            const reader = new FileReader();
            reader.onload = function() {
                callback(reader.result); // retorna la imagen en base64
            };
            reader.readAsDataURL(response.response);
        },
        onerror: function(err) {
            console.error("Error cargando imagen:", err);
            callback(""); // fallback si falla
        }
    });
}
