import { mapColor, borderColor } from './config'
import L from 'leaflet'
import { africa } from './data/africajson'
import html2canvas from 'html2canvas'
import { Canvas2Image } from './lib/canvas2image'
import pym from 'pym.js'
import { addCountryMap } from './country-maps'
let formatNumber = new Intl.NumberFormat()
let tooltip = document.querySelector('.tooltip')
let countryStatus
async function getCountryData() {
  await fetch('https://api.mediahack.co.za/vaccines/africa-country-status.php')
    .then((data) => data.json())
    .then((data) => {
      // countryStatus = data.filter((d) => d.iso !== 'CPV')
      countryStatus = data
    })
}

let countryData
fetch('https://api.mediahack.co.za/adh/countries-json.php')
  .then((data) => data.json())
  .then((data) => {
    countryData = data
  })

let owid
fetch('https://api.mediahack.co.za/vaccines/owid.php')
  .then((data) => data.json())
  .then((data) => {
    owid = data
  })

function inIframe() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

function mapStyle(feature) {
  let fillColor = '#fff'
  let country = countryStatus.filter(
    (d) => d.iso === feature.properties.ADM0_A3
  )
  if (country.length > 0) {
    fillColor = mapColor
  }
  return {
    color: borderColor,
    fillColor: fillColor,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    apiUrl: '',
  }
}

let mapAfrica

function addAfricaMap() {
  mapAfrica = L.map('map-africa', {
    renderer: L.canvas(),
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    zoomSnap: 0.1,
  }).setView([51.505, -0.09], 13)

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: hover,
      mousemove: move,
      mouseout: out,
    })
  }

  function hover(feature) {
    tooltip.style.left = feature.originalEvent.clientX + 15 + 'px'
    tooltip.style.top = feature.originalEvent.clientY + 5 + 'px'
    let tt = `<div class="tt-inner"><div class="tt-country">${feature.target.feature.properties.NAME_LONG}</div>`

    let iso = feature.target.feature.properties.ADM0_A3
    let cd = countryData.filter(
      (d) => d.iso_code === iso && d.vaccination_started === 'Yes'
    )
    if (cd.length > 0) {
      tt += `<div class="tt-vaccines-label">Vaccines in Use</div>`
      cd.forEach((d) => {
        tt += `<div class="tt-vaccines">${d.common_name}</div>`
      })
    }
    let tv = owid.filter((d) => d.iso_code === iso)
    let ttv
    if (tv.length > 0) {
      tt += `<div class="tt-total-label">Total Vaccinations</div>`
      tt += `<div class="tt-value">${formatNumber.format(
        tv[0].total_vaccinations
      )}</div>`
    } else {
      tt += `<div class="tt-total-label">Total Vaccinations</div>`
      tt += `<div class="tt-value">No Data</div>`
    }

    tt += `</div>`
    tooltip.innerHTML = tt

    let country = countryStatus.filter(
      (d) => d.iso === feature.target.feature.properties.ADM0_A3
    )
    if (country.length > 0) {
      tooltip.style.display = 'block'
    }
  }

  function move(feature) {
    tooltip.style.left = feature.originalEvent.clientX + 15 + 'px'
    tooltip.style.top = feature.originalEvent.clientY + 5 + 'px'
  }

  function out(feature) {
    tooltip.style.display = 'none'
  }

  let africaMap = L.geoJSON(africa, {
    onEachFeature: onEachFeature,
    style: mapStyle,
  }).addTo(mapAfrica)
  mapAfrica.fitBounds(africaMap.getBounds(), { padding: [10, 10] })
}

// adds the placeholders for the maps
async function addCountryMaps(iso) {
  let node = document.createElement('div')
  node.classList.add('box')
  node.id = iso
  document.getElementById('countries').appendChild(node)

  let inner = `<div class="map-holder" id="map-${iso.toLowerCase()}"></div><div class="details"><div class="details-title"></div><div class="details-vaccines"></div><div class="total-vaccines">Total vaccinations:<br/><span class="total-vaccines-number"></div></div></div>`

  document.getElementById(iso).innerHTML = inner
}

getCountryData()
  .then(() => {
    countryStatus.forEach((c) => {
      addCountryMaps(c.iso)
    })
  })
  .then(() => {
    addAfricaMap()
  })
  .then(() => {
    console.log(countryStatus)

    countryStatus.forEach((c) => {
      addCountryMap(c.iso, `map-${c.iso.toLowerCase()}`, countryStatus)
    })
  })

function downloadImage() {
  let w = document.querySelector('.container').offsetWidth
  let h = document.querySelector('.container').offsetHeight
  html2canvas(document.querySelector('.container'), {
    width: w + 10,
  }).then((canvas) => {
    return Canvas2Image.saveAsPNG(canvas)
  })
}

function showEmbed() {
  document.querySelector('.iframe-wrap').style.visibility = 'visible'
}

function hideEmbed() {
  document.querySelector('.iframe-wrap').style.visibility = 'hidden'
}

let close = document.querySelector('.close')
close.addEventListener('click', hideEmbed)

let button = document.querySelector('.download-img')
button.addEventListener('click', downloadImage)

let embedButton = document.querySelector('.embed')
embedButton.addEventListener('click', showEmbed)

document.querySelector('.information').style.display = 'block'

var pymChild = new pym.Child({ polling: 500 })
