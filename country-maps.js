import { mapColor, borderColor } from './config'
import { africa } from './data/africajson'
import { vaccineCodes, colors } from './data/codes'
import L from 'leaflet'
let formatNumber = new Intl.NumberFormat()
let owid
fetch('https://api.mediahack.co.za/vaccines/owid.php')
  .then((data) => data.json())
  .then((data) => {
    owid = data
  })
let saVaccineCount
fetch('https://api.mediahack.co.za/vaccines/sa-vaccines.php')
  .then((data) => data.json())
  .then((data) => {
    saVaccineCount = data
  })

let vaccines
async function getVaccineData() {
  await fetch('https://api.mediahack.co.za/vaccines/countries.php')
    .then((data) => data.json())
    .then((data) => {
      vaccines = data
    })
}
getVaccineData()

let mapBase = {
  type: 'FeatureCollection',
  features: [],
}

function mapStyle(feature) {
  return {
    color: borderColor,
    fillColor: mapColor,
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    apiUrl: '',
  }
}

export function addCountryMap(iso, target, countryStatus) {
  mapBase = {
    type: 'FeatureCollection',
    features: [],
  }
  let country = africa.features.filter((d) => d.properties.ADM0_A3 === iso)
  mapBase.features.push(country[0])
  let mapCountry = L.map(target, {
    renderer: L.canvas(),
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    zoomSnap: 0.1,
  }).setView([51.505, -0.09], 13)

  let newMap = L.geoJSON(mapBase, {
    style: mapStyle,
  }).addTo(mapCountry)
  mapCountry.fitBounds(newMap.getBounds(), { padding: [6, 6] })

  // Addcard data
  // getVaccineData().then(() => {
  setTimeout(() => {
    let cn = countryStatus.filter((d) => d.iso === iso)

    let countryName = cn[0].country
    document
      .getElementById(iso)
      .querySelector('.details-title').innerHTML = countryName

    let tv = owid.filter((d) => d.iso_code === iso)
    if (tv.length > 0) {
      let vaccount
      if (iso === 'ZAF') {
        vaccount = formatNumber.format(+saVaccineCount[0].vaccinated_total)
      } else {
        vaccount = formatNumber.format(+tv[0].total_vaccinations)
      }
      document
        .getElementById(iso)
        .querySelector('.total-vaccines-number').innerHTML = vaccount
    } else {
      document
        .getElementById(iso)
        .querySelector('.total-vaccines-number').innerHTML = 'No Data'
    }

    vaccineCodes.forEach((d, i) => {
      if (vaccines.countries[countryName][`${d}_started`] === 'true') {
        addVaccineMarker(i, iso)
      }
    })
  }, 200)
}

function addVaccineMarker(i, iso) {
  let div = document.createElement('div')
  div.classList.add(`v-row-${i}`)
  div.classList.add('vaccine-row')
  document
    .getElementById(iso)
    .querySelector('.details-vaccines')
    .appendChild(div)

  let node = document.createElement('div')
  node.classList.add('circle')
  node.classList.add(`v_${i}`)

  let addedCircle = document
    .getElementById(iso)
    .querySelector(`.v-row-${i}`)
    .appendChild(node)
  let col = colors[i + 1]
  document.getElementById(iso).querySelector(`.v_${i}`).style.background = col

  let nodeTwo = document.createElement('div')
  nodeTwo.classList.add('vaccine-label')
  let nodeText = document.createTextNode(vaccines.key[`v${i + 1}`])
  nodeTwo.appendChild(nodeText)
  let addedText = document
    .getElementById(iso)
    .querySelector(`.v-row-${i}`)
    .appendChild(nodeTwo)
}
