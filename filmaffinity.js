// ==UserScript==
// @name         Lista HD en FilmAffinity
// @namespace    http://tampermonkey.net/
// @version      1.1.7
// @description  Crea un overlay estilo FilmAffinity para la lista HD
// @author       Marc
// @match        https://www.filmaffinity.com/*
// @updateURL    https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @downloadURL  https://raw.githubusercontent.com/MarcRoviraP/tampermonkey_scripts/main/filmaffinity.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

let listaHD = JSON.parse(GM_getValue('listaHD', '[]'));
var color1 = "#447CAD";
var color2 = "#F9C700";

(function () {
    'use strict';

    document.addEventListener("keydown", function (e) {
    if (e.altKey && e.key.toLowerCase() === "o") {
        e.preventDefault(); // Evita acciones por defecto (por ejemplo, menú del navegador)
        mostrarOverlayHD(); // Aquí llamas tu función
    }
});

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

    const delDiv = document.querySelector('.add-movie-list-info.add-to-list-button');
    if (delDiv) delDiv.remove();

    const targetDiv = document.querySelector('.add-text-content');
    if (targetDiv) {
        const newChild = document.createElement('a');
        newChild.textContent = ' Lista HD en espera';
        newChild.style.color = '${color1}';
        newChild.style.fontWeight = 'bold';
        newChild.style.cursor = 'pointer';
        targetDiv.appendChild(newChild);

        const hdButton = document.createElement('button');
        hdButton.textContent = 'HD';
        hdButton.style.cssText = `
            background: ${color1};
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
        targetDiv.appendChild(hdButton);

        newChild.addEventListener('click', mostrarOverlayHD);
        hdButton.addEventListener('click', addFav);
    }
})();

function guardarLista() {
    GM_setValue('listaHD', JSON.stringify(listaHD));
}

function addFav() {
    const nombre = document.getElementById("main-title").textContent;
    const existe = listaHD.some(peli => peli.nombre === nombre);

    if(existe) return
    const imagen = document.querySelector('img[itemprop="image"]');
    const url = imagen.src;
    const hd = document.getElementsByClassName('film-right-box vod-wrapper')[0];
    const hdValue = hd ? 1 : 0;
    const urlPelicula = window.location.href;


    listaHD.unshift({
        id: Date.now().toString(),
        urlImg: url,
        nombre: nombre,
        estado: hdValue,
        urlPeli:urlPelicula
    });
    console.log(urlPelicula)
    guardarLista();
}

function mostrarOverlayHD() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    function borrarPeli(id) {
        listaHD = listaHD.filter(peli => peli.id !== id);
        guardarLista();
        actualizarLista();
    }

    function generarListaHD() {
        return listaHD.map(item => `
<li style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee; gap: 10px;">
    <!-- ZONA CLICABLE -->
    <a href="${item.urlPeli}" style="display: flex; align-items: center; gap: 10px; text-decoration: none; flex: 1;">
        <div style="width: 70px; height: 104px; overflow: hidden; border-radius: 8px;">
            <img src="${item.urlImg}" width="70" height="104" style="object-fit: cover;" />
        </div>
        <span style="font-size: 18px; line-height: 1.4; color: ${color1};">
            ${item.nombre}
        </span>
    </a>


                <div style="display: flex; gap: 8px; align-items: center;">
${item.estado === 1 ? `
    <button data-id="${item.id}"
        style="
            background: ${item.estado === 1 ? color1 : "#FFF"};
            border: none;
            color: white;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            cursor: pointer;
            font-size: 14px;
        ">
        <span class="btn-estado blink" style="color: ${color2}">HD</span>
    </button>
` : `
    <span></span>
`}


                    <button class="btn-borrar" data-id="${item.id}"
                        style="
                            background: ${color1};
                            border: none;
                            color: white;
                            border-radius: 50%;
                            width: 35px;
                            height: 35px;
                            cursor: pointer;
                            font-size: 22px;
                            font-weight: bold;
                        ">
                        ×
                    </button>
                </div>
            </li>
        `).join('');
    }

    overlay.innerHTML = `
        <div style="background: #fff; border-radius: 10px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;">
            <div style="background: ${color1}; padding: 20px; color: white; font-size: 22px; font-weight: bold; text-align: center; position: relative;">
                LISTA <span style="color: ${color2};">HD</span> DE ESPERA
                <div id="contador" style="font-size: 14px; margin-top: 5px;">${listaHD.length} películas</div>
                <button id="closeOverlayBtn" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; cursor: pointer; border-radius: 50%; width: 30px; height: 30px;">✖</button>
            </div>

            <div id="listaContainer" style="padding: 20px;">
                ${listaHD.length === 0 ?
        '<div style="text-align: center; padding: 40px; color: #666;">No hay películas en la lista HD</div>' :
    '<ul id="lista-hd" style="list-style: none; padding: 0; margin: 0;">' + generarListaHD() + '</ul>'
}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    function actualizarLista() {
        const container = overlay.querySelector('#listaContainer');
        const contador = overlay.querySelector('#contador');
        if (listaHD.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No hay películas en la lista HD</div>';
        } else {
            container.innerHTML = '<ul id="lista-hd" style="list-style: none; padding: 0; margin: 0;">' + generarListaHD() + '</ul>';
        }
        contador.textContent = `${listaHD.length} películas`;
    }

    // ✅ Delegación de eventos
    overlay.addEventListener('click', (e) => {
        if (e.target.matches('.btn-borrar')) {
            borrarPeli(e.target.dataset.id);
        }
    });

    overlay.querySelector('#closeOverlayBtn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        overlay.remove();
    }
});
}
