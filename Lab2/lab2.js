canvas = document.getElementById("graph")
ctx = canvas.getContext("2d")
centerX = canvas.width / 2
centerY = canvas.height / 2

let r = 0
results = []
rSelect = document.getElementById("R")
tableBody = document.getElementById("results-body")
umx = (canvas.width * 0.9) / 10
umy = (canvas.height * 0.9) / 6

loadPoints()

drawCoordinatePlane()

rSelect.addEventListener("change", function () {
    r = Number(rSelect.value)
    console.log("R изменился")
    drawArea()
})

drawAllExistingDots()

form = document.getElementById("point-form")

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const xArray = document.querySelectorAll('input[name="x"]:checked');
    const yValue = document.getElementById("y").value;

    if (!validateCoordinates(xArray, yValue, r)) {
        console.log("Не удалось нарисовать точки");
        return;
    }

    const y = Number(yValue);
    const radius = Number(r);

    for (const element of xArray) {
        const x = Number(element.value);

        try {
            const params = new URLSearchParams({
                x: x,
                y: y,
                r: radius
            });

            const response = await fetch("/check?" + params);

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();

            tableAddValues(data);
            results.push(data);

            drawDot(data.x, data.y, data.hit);

            console.log("Точка нарисована");

        } catch (error) {
            console.error("Ошибка проверки точки:", error.message);
        }
    }
});

canvas.addEventListener("click", async function(event) {
    const mouseX = event.offsetX
    const mouseY = event.offsetY

    console.log("Клац-клац")

    if (results.length != 0) {
        for (let i = 0; i < results.length; i++) {
            const dot = results[i]
            const dotX = centerX + Number(dot.x) * umx
            const dotY = centerY - Number(dot.y) * umy

            if (distance(dotX, dotY, mouseX, mouseY) <= 6) {
                await deleteDot(i)
                break
            }
        }
    }
})

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function tableAddValues(resultObject) {
    const row = document.createElement("tr")
    const cellX = document.createElement("td")
    const cellY = document.createElement("td")
    const cellR = document.createElement("td")
    const cellResult = document.createElement("td")
    const cellData = document.createElement("td")
    const cellExecution = document.createElement("td")

    cellX.textContent = resultObject.x
    row.appendChild(cellX)

    cellY.textContent = resultObject.y
    row.appendChild(cellY)

    cellR.textContent = resultObject.r
    row.appendChild(cellR)

    cellResult.textContent = resultObject.hit
    row.appendChild(cellResult)

    const date = new Date(resultObject.timestamp * 1000)
    const formattedDate = date.toLocaleString("ru-RU")
    cellData.textContent = formattedDate
    row.appendChild(cellData)

    cellExecution.textContent = resultObject.executionTime.toFixed(3) + " мс"
    row.appendChild(cellExecution)

    tableBody.appendChild(row)

    console.log("Данные добавлены")
}

async function deleteDot(index) {
    const dot = results[index]

    if (!dot || !dot.id) {
        console.error("Не найден ID точки!")
        return
    }

    try {
        const params = new URLSearchParams({
            id: dot.id
        })

        const response = await fetch("/delete?" + params, {
            method: "DELETE"
        })

        if (!response.ok) {
            throw new Error(await response.text())
        }

        results.splice(index, 1)

        if (tableBody.rows[index]) {
            tableBody.rows[index].remove()
        }

        drawArea()

        console.log("Точка удалена из MongoDB и таблицы")
    }
    catch (error) {
        console.error("Ошибка удаления точки:", error.message)
    }
}

function drawAllDots() {
    for (dot of results) {
        x = Number(dot.x)
        y = Number(dot.y)
        drawDot(x, y)
    }
}

function drawAllExistingDots() {
    for (i of results) {
        x = Number(i.x)
        y = Number(i.y)
        drawDot(x, y)
    }
}

function drawDot(x, y) {
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

    ctx.beginPath()
    ctx.moveTo(canvas.width, centerY)
    ctx.lineTo(0, centerY)
    ctx.stroke()

    ctx.moveTo(centerX, canvas.height)
    ctx.lineTo(centerX, 0)
    ctx.stroke()

    ctx.moveTo(canvas.width, centerY)
    ctx.lineTo(canvas.width - 20, centerY - 10)
    ctx.stroke()

    ctx.moveTo(canvas.width, centerY)
    ctx.lineTo(canvas.width - 20, centerY + 10)
    ctx.stroke()

    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX - 10, 20)
    ctx.stroke()

    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX + 10, 20)
    ctx.stroke()

    ctx.font = "16px Arial"
    ctx.fillText("x", canvas.width - 10, centerY + 25)
    ctx.fillText("y", centerX + 20, 20)

    for (let i = -5; i <= 5; i++) {
        if (i === 0) {
            continue
        }

        ctx.beginPath()
        ctx.moveTo(centerX + i * umx, centerY + 5)
        ctx.lineTo(centerX + i * umx, centerY - 5)
        ctx.fillText(i, centerX - 5 + i * umx, centerY + 25)
        ctx.stroke()
        

        if (i >= -3 && i <= 3) {
        ctx.moveTo(centerX + 5, centerY - i * umy)
        ctx.lineTo(centerX - 5, centerY - i * umy)
        ctx.fillText(i, centerX + 10, centerY + 5 - i * umy)
        ctx.stroke()
        }
    }

    ctx.closePath()
}

function drawArea() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "rgba(115, 115, 213, 0.5)"

    ctx.fillRect(
        centerX - r * umx,
        centerY - r / 2 * umy,
        r * umx,
        r / 2 * umy
    )

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX, centerY - r * umy)
    ctx.lineTo(centerX + r / 2 * umx, centerY)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(
        centerX,
        centerY,
        r / 2 * umx,
        Math.PI / 2,
        Math.PI
    )
    ctx.closePath()
    ctx.fill()

    drawCoordinatePlane()
    drawR()

    if (results.length != 0) {
        drawAllDots()
    }
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

    ctx.moveTo(centerX - 5, centerY + r / 2 * umy)
    ctx.lineTo(centerX + 5, centerY + r / 2 * umy)
    ctx.stroke()

    ctx.moveTo(centerX - 5, centerY + r * umy)
    ctx.lineTo(centerX + 5, centerY + r * umy)
    ctx.stroke()

    ctx.moveTo(centerX - 5, centerY - r / 2 * umy)
    ctx.lineTo(centerX + 5, centerY - r / 2 * umy)
    ctx.stroke()

    ctx.moveTo(centerX - 5, centerY - r * umy)
    ctx.lineTo(centerX + 5, centerY - r * umy)
    ctx.stroke()

    ctx.closePath()
}

function validateCoordinates(xArray, y, r) {
    if (xArray.length >= 1) {
        if (y.trim() === "" || Number.isNaN(Number(y))) {
            alert("Введите корректное число Y!")
            return false
        }

        if (r === 0 || Number.isNaN(r)) {
            alert("Введите корректное число R!")
            return false
        }
        else {
            return true
        }
    }
    else {
        alert("Выберите хотя бы 1 из вариантов X!")
        return false
    }
}

async function loadPoints() {
    try {
        const response = await fetch("/points")

        if (!response.ok) {
            throw new Error(await response.text())
        }

        results = await response.json()

        tableBody.replaceChildren()

        for (const item of results) {
            tableAddValues(item)
        }

        drawArea()
    }
    catch (error) {
        console.error("Ошибка загрузки точек:", error.message)
    }
}
