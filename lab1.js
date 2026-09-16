canvas = document.getElementById("graph")
ctx = canvas.getContext("2d")
centerX = canvas.width / 2
centerY = canvas.height / 2

let r = 0
results = []
rSelect = document.getElementById("R")
tableBody = document.getElementById("results-body")
umx = (canvas.width * 0.9) / 6
umy = (canvas.height * 0.9) / 6

if (localStorage.getItem("results") !== null) {
    results = JSON.parse(localStorage.getItem("results"))
    for (const item of results) {
    tableAddValues(item)
}
}

drawCoordinatePlane()

rSelect.addEventListener("change", function () {
    r = Number(rSelect.value)
    console.log("R изменился")
    drawArea()
})

form = document.getElementById("point-form")
form.addEventListener("submit", function(event) {
    event.preventDefault()
    x = document.querySelectorAll('input[name="x"]:checked')
    y = document.getElementById("y").value
    if (validateCoordinates(x,y,r)) {
        x = Number(x[0].value)
        y = Number(y)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawDot(x, y)
        console.log("Точка нарисована")
        result = checkPosition(x, y, r)
        timestamp = Date.now()
        const resultObject = {
            x: x,
            y: y,
            r: r,
            result: result,
            timestamp: timestamp
        }
        tableAddValues(resultObject)
        results.push(resultObject)
        localStorage.setItem("results", JSON.stringify(results))
    }
    else {
        console.log("Не удалось нарисовать точку")
    }
})

function tableAddValues(resultObject) {
    const row = document.createElement("tr")
    const cellX = document.createElement("td")
    const cellY = document.createElement("td")
    const cellR = document.createElement("td")
    const cellResult = document.createElement("td")
    const cellData = document.createElement("td")
    cellX.textContent = resultObject.x
    row.appendChild(cellX)
    cellY.textContent = resultObject.y
    row.appendChild(cellY)
    cellR.textContent = resultObject.r
    row.appendChild(cellR)
    cellResult.textContent = resultObject.result
    row.appendChild(cellResult)
    date = Date(resultObject.timestamp)
    formattedDate = date.toLocaleString("ru-RU")
    cellData.textContent = date
    row.appendChild(cellData)
    tableBody.appendChild(row)
    console.log("Данные добавлены")
}

function drawDot(x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawArea()
    ctx.beginPath()
    ctx.fillStyle = "rgb(255, 0, 0)"
    console.log(x, y)
    ctx.arc(centerX + x * umx, centerY - y * umy, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "black"
    ctx.closePath()
}

function drawCoordinatePlane() {
ctx.fillStyle = "black"
ctx.beginPath() //Координатная плоскость
ctx.moveTo(canvas.width, centerY)
ctx.lineTo(0, centerY)
ctx.stroke()
ctx.moveTo(centerX, canvas.height)
ctx.lineTo(centerX, 0)
ctx.stroke()

ctx.moveTo(canvas.width, centerY)   //Стрелочка для оси X
ctx.lineTo(canvas.width - 20, centerY - 10)
ctx.stroke()
ctx.moveTo(canvas.width, centerY)
ctx.lineTo(canvas.width - 20, centerY + 10)
ctx.stroke()

ctx.moveTo(centerX, 0)  //Стрелочка для оси Y
ctx.lineTo(centerX - 10, 20)
ctx.stroke()
ctx.moveTo(centerX, 0)
ctx.lineTo(centerX + 10, 20)
ctx.stroke()

ctx.font = "16px Arial"
ctx.fillText("x",canvas.width - 10, centerY + 25)
ctx.fillText("y",centerX + 20, 20)

for (let i = -3; i <= 3; i++) {
    if (i === 0) {
        continue
    }
    ctx.beginPath()
    ctx.moveTo(centerX + i * umx, centerY + 5)
    ctx.lineTo(centerY + i * umx, centerY - 5)
    ctx.fillText(i, centerX - 5 + i * umx, centerY + 25)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(centerX + 5, centerY - i * umy)
    ctx.lineTo(centerX - 5, centerY - i * umy)
    ctx.fillText(i, centerX + 10, centerY + 5 - i * umy)
    ctx.stroke()
}
ctx.closePath()
}

function drawArea() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "rgba(115, 115, 213, 0.5)"
    ctx.fillRect(centerX, centerY - r * umy, r * umx, r * umy)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX, centerY + r * umy)
    ctx.lineTo(centerX - r / 2 * umx, centerY)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX,centerY, r / 2 * umx, Math.PI, Math.PI * 1.5)
    ctx.closePath()
    ctx.fill()
    drawCoordinatePlane()
    drawR()
}

function drawR() {
    if (r === 0) {
        return
    }
    ctx.fillStyle = "black"
    ctx.fillText("R", centerX + r * umx, centerY - 5)
    ctx.fillText("R", centerX - 20, centerY - r * umy)
    ctx.fillText("R / 2", centerX - 40, centerY - r / 2 * umy)
    ctx.fillText("-R / 2", centerX - r / 2 * umx, centerY - 5)
    ctx.fillText("-R / 2", centerX - 50, centerY + r / 2 * umy)
    ctx.fillText("-R", centerX - 25, centerY + r * umy)
    ctx.beginPath()
    ctx.moveTo(centerX + r * umx, centerY + 5)
    ctx.lineTo(centerX + r * umx, centerY - 5)
    ctx.stroke()
    ctx.moveTo(centerX - r / 2 * umx, centerY + 5)
    ctx.lineTo(centerX - r / 2 * umx, centerY - 5)
    ctx.stroke()
    ctx.moveTo(centerX - 5, centerY + r / 2 * umx)
    ctx.lineTo(centerX + 5, centerY + r / 2 * umx)
    ctx.stroke()
    ctx.moveTo(centerX - 5, centerY + r * umx)
    ctx.lineTo(centerX + 5, centerY + r * umx)
    ctx.stroke()
    ctx.moveTo(centerX - 5, centerY - r / 2 * umx)
    ctx.lineTo(centerX + 5, centerY - r / 2 * umx)
    ctx.stroke()
    ctx.moveTo(centerX - 5, centerY - r  * umx)
    ctx.lineTo(centerX + 5, centerY - r  * umx)
    ctx.stroke()
    ctx.closePath()
}

function checkPosition(x, y, r) {
    if (x > 0 && y > 0 && x <= r && y <= r) {
        return true
    }
    else if (x < 0 && y > 0 && (x ^ 2 + y ^ 2 <= (r/2) ^ 2)) {
        return true
    }
    else if (x < 0 && y < 0 && y >= -2 * x - r) {
        return true
    }
    else {
        return false
    }
}

function validateCoordinates(xArray, y, r) {
if (xArray.length == 1) {
    if (y.trim() === "" || Number.isNaN(Number(y))) {
        alert("Введите корректное число Y!")
        return false
    }
    if (Number.isNaN(r)) {
        alert("Введите корректное число R!")
        return false
    }
    else {
        return true
    }
}
else {
    alert("Выберите только один из вариантов X!")
    return false
}
}
