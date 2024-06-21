const documentColors = getComputedStyle(document.documentElement);
let statisticsData;

function initStatistics() {
    document.getElementById('date-from').addEventListener('change', updateStatictics);
    document.getElementById('date-to').addEventListener('change', updateStatictics);
    updateStatictics();
    window.addEventListener('resize', refreshStats);
}

function updateStatictics() {
    let uri = '/api/statistics';
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;

    if (dateFrom !== '') {
        uri += '?dateFrom=' + dateFrom;
        if (dateTo !== '') {
            uri += '&dateTo=' + dateTo;
        }
    } else if (dateTo !== '') {
        uri += '?dateTo=' + dateTo;
    }

    fetch(uri).then(function(response) {
        if (response.status >= 200 && response.status < 300) {
            response.json().then(function (data) {
                statisticsData = data;
                refreshStats();
            });
        }
    }).catch(function() {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function refreshStats() {
    const canvs = document.getElementById('statistics').getElementsByTagName('canvas');
    const borderBarBottom = 150;
    const borderBarTop = 40;
    let canvas, data;

    for (const canv of canvs) {
        data = statisticsData[canv.getAttribute('data')];

        if ( !data.data || data.data.length === 0) {
            canv.parentNode.style.display = 'none';
            continue;
        }
        canvas = canv.getContext('2d');
        computeStatisticsData(data, 0);

        if (data.type === 'pie')
            canv.classList.add('pie');

        canv.width = canv.clientWidth * 2;
        canv.height = canv.clientHeight * 2;
        canvas.clearRect(0, 0, canv.width, canv.height);

        if (canv.parentNode.style.display === 'none')
            canv.parentNode.style.display = 'block';

        if (data.type === 'bar' || data.type === 'line') {
            // x_start, y_start, x_width, y_height
            const drawingArea = [canv.width / (data.data.length + 2), canv.height - borderBarBottom, canv.width - canv.width / (data.data.length + 2) * 2, canv.height - borderBarBottom - borderBarTop];
            let barWidth = drawingArea[2] / (data.data.length - 1) * 0.7;

            if (data.length === 1)
                barWidth = drawingArea[2];
            canvas.font = '25px sans-serif';
            canvas.fillStyle = documentColors.getPropertyValue('--h2-color');
            canvas.beginPath();

            if (data.type === 'line' && data.data.length === 1) {
                canvas.fillStyle = documentColors.getPropertyValue('--h1-color');
                canvas.arc(drawingArea[0], drawingArea[1] - data.data[0].relativeSize * drawingArea[3], 4, 0, 2 * Math.PI);
                canvas.fill();
            }

            for (let i = 0; i !== data.data.length; i++) {
                if (data.type === 'line' && i !== data.data.length - 1) {
                    canvas.moveTo(drawingArea[0] + i * drawingArea[2] / (data.data.length - 1), drawingArea[1] - data.data[i].relativeSize * drawingArea[3]);
                    canvas.lineTo(drawingArea[0] + (i + 1) * drawingArea[2] / (data.data.length - 1) + 2, drawingArea[1] - data.data[i + 1].relativeSize * drawingArea[3]);
                    canvas.stroke();
                    canvas.lineTo(drawingArea[0] + (i + 1) * drawingArea[2] / (data.data.length - 1) + 2, drawingArea[1]);
                    canvas.lineTo(drawingArea[0] + i * drawingArea[2] / (data.data.length - 1), drawingArea[1]);
                    canvas.fillStyle = documentColors.getPropertyValue('--lightPrimaryColor');
                    canvas.fill();
                }
                canvas.beginPath();

                if (data.type === 'bar') {
                    canvas.fillStyle = documentColors.getPropertyValue('--primaryColor');
                    const mid = drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)) - barWidth / 2;
                    canvas.fillRect(mid, drawingArea[1], barWidth, -data.data[i].relativeSize * drawingArea[3]);
                    canvas.shadowBlur = 0;
                }

                // draw circles
                if (data.type === 'line') {
                    canvas.beginPath();
                    canvas.strokeStyle = "";
                    for (let i = 0; i !== data.data.length; i++) {
                        canvas.moveTo(drawingArea[0] + i * drawingArea[2] / (data.data.length - 1), drawingArea[1] - data.data[i].relativeSize * drawingArea[3]);
                        canvas.arc(drawingArea[0] + i * drawingArea[2] / (data.data.length - 1), drawingArea[1] - data.data[i].relativeSize * drawingArea[3], 4, 0, 2 * Math.PI);
                        canvas.fillStyle = documentColors.getPropertyValue('--h1-color');
                        canvas.fill();
                    }
                    canvas.beginPath();
                }

                canvas.textAlign = 'center';
                // value background, pass on the line
                canvas.stroke();
                canvas.beginPath();
                canvas.fillStyle = '#FFF';
                canvas.fillRect(drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)) - data.data[i].value.toString().length * 7, drawingArea[1] - data.data[i].relativeSize * drawingArea[3] - 37, data.data[i].value.toString().length * 14, 29);
                canvas.fillStyle = documentColors.getPropertyValue('--h2-color');

                // value
                canvas.textBaseline = 'bottom';
                canvas.fillText(data.data[i].value, drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)), drawingArea[1] - data.data[i].relativeSize * drawingArea[3] - 10);
                canvas.textBaseline = 'top';
                canvas.textAlign = 'left';
                const labelPos = [drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)), drawingArea[1] + borderBarBottom / 2];
                canvas.translate(labelPos[0], labelPos[1]);
                canvas.textAlign = 'center';
                canvas.rotate(0.45);
                // label
                canvas.fillText(data.data[i].title, 0, 0);
                canvas.rotate(-0.45);
                canvas.translate(-labelPos[0], -labelPos[1]);
            }
            canvas.moveTo(0, drawingArea[1]);
            canvas.lineTo(canv.width, drawingArea[1]);
            canvas.moveTo(0, drawingArea[1]);
            canvas.lineTo(0, drawingArea[1] - drawingArea[3]);
            canvas.moveTo(0, drawingArea[1] - drawingArea[3]);
            canvas.lineTo(0, drawingArea[1] - drawingArea[3]);

            for (let i = 0; i !== data.data.length; i++) {
                canvas.moveTo(drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)), drawingArea[1] - 6);
                canvas.lineTo(drawingArea[0] + i * drawingArea[2] / (data.data.length === 1 ? 1 : (data.data.length - 1)), drawingArea[1] + 6);
            }
            canvas.stroke();
        } else if (data.type === 'pie') {
            const drawingArea = [0, 0, canv.width, canv.height];
            const center = [(drawingArea[2] - drawingArea[0]) * 0.6 + drawingArea[0], (drawingArea[3] - drawingArea[1]) / 2 + drawingArea[1]];
            const descPos = drawingArea[0] + drawingArea[2] / 13;
            const radius = center[1] / 1.5;
            const extendedRadius = center[1] / 1.25;
            const pieDescStep = drawingArea[3] / 14;
            let pieDescY = drawingArea[1];

            canvas.font = '25px sans-serif';
            canvas.lineWidth = radius;

            let arcBegin = Math.PI * 1.5;

            for (let i = 0; i !== data.data.length; i++) {
                const color = getColorHash(data.data[i].title);

                // draw pie
                canvas.beginPath();
                canvas.strokeStyle = 'hsl(' + color + ', 80%, 65%)';
                const colorStyle = canvas.strokeStyle;
                canvas.fillStyle = colorStyle;
                canvas.arc(center[0], center[1], radius, arcBegin, arcBegin + Math.PI * data.data[i].relativeSize * 2);
                arcBegin += Math.PI * data.data[i].relativeSize * 2;
                canvas.stroke();

                // draw description text
                canvas.font = '25px sans-serif';
                canvas.fillStyle = "#515252";
                canvas.textBaseline = 'middle';
                canvas.textAlign = 'right';
                canvas.fillText(formatPourcentage(data.data[i].relativeSize * 100), descPos - pieDescStep * 0.5, pieDescY + pieDescStep * 0.5);
                canvas.fillStyle = colorStyle;
                canvas.fillRect(descPos, pieDescY + pieDescStep * 0.25, pieDescStep * 0.5, pieDescStep * 0.5);
                canvas.textBaseline = 'middle';
                canvas.textAlign = 'left';
                canvas.fillStyle = 'hsl(' + color + ', 80%, 40%)';
                canvas.fillText(data.data[i].title, descPos + pieDescStep * 0.75, pieDescY + pieDescStep * 0.5);
                pieDescY += pieDescStep;
            }
            canvas.beginPath();
            canvas.lineWidth = '2';

            // draw pie separators + text
            arcBegin = Math.PI * 1.5;

            for (let i = 0; i !== data.data.length; i++) {
                const angle = (arcBegin + Math.PI * data.data[i].relativeSize) % (Math.PI * 2);
                const piecePos = [center[0] + extendedRadius * Math.cos(angle), center[1] + extendedRadius * Math.sin(angle)];
                const separator = [center[0] + radius * 0.5 * Math.cos(arcBegin), center[1] + radius * 0.5 * Math.sin(arcBegin),
                                   center[0] + radius * 1.5 * Math.cos(arcBegin), center[1] + radius * 1.5 * Math.sin(arcBegin)];
                canvas.strokeStyle = '#FFF';
                canvas.moveTo(separator[0], separator[1]);
                canvas.lineTo(separator[2], separator[3]);

                canvas.strokeStyle = "";
                canvas.fillStyle = '#FFF';
                canvas.textAlign = 'center';
                canvas.textBaseline = 'middle';

                if (data.data[i].relativeSize > 0.03)
                    canvas.fillText(data.data[i].value, piecePos[0], piecePos[1]);
                arcBegin += Math.PI * data.data[i].relativeSize * 2;
            }
            canvas.stroke();
        }
    }
}

function formatPourcentage(str) {
    return str.toFixed(1).replace('.', ',').concat("%");
}

// add relativeSize to statictics data array
function computeStatisticsData(data, baseMin) {
    let i = 0;

    if (data.type === 'bar' || data.type === 'line') {
        i = 0;

        if (data.data.length < 2) {
            if (data.data.length === 1)
                data.data[0].relativeSize = (data.data[0].value ? 1 : 0);
            return data.data;
        }
        let max = data.data[i].value;
        let min = data.data[i].value;

        while (i !== data.data.length) {
            if (data.data[i].value > max)
                max = data.data[i].value;
            if (data.data[i].value < min)
                min = data.data[i].value;
            i++;
        }

        if (baseMin !== undefined)
            min = baseMin;
        i = 0;

        if (min === max) {
            while (i !== data.data.length) {
                data.data[i].relativeSize = min ? 1 : 0;
                i++;
            }
        } else {
            if (min !== 0) {
                min -= (max - min) * 0.02;
            }
            max -= min;

            while (i !== data.data.length) {
                data.data[i].relativeSize = (data.data[i].value - min) / max;
                i++;
            }
        }
    } else if (data.type === 'pie') {
        let total = 0.0;

        // get total
        while (i !== data.data.length) {
            total += data.data[i].value;
            i++;
        }
        i = 0;

        while (i !== data.data.length) {
            data.data[i].relativeSize = data.data[i].value / total;
            i++;
        }
    }
}

// hash a string and return a corresponding color
function getColorHash(str) {
    const hashRef = [769.5, 1459.5, 915, 2628, 1285.5, 2299.5, 925.5, 2466, 1206, 3235.5, 1597.5, 1486.5, 1672.5];
    const colors = [0, 48, 144, 216, 96, 288, 24, 168, 240, 312, 72, 120, 192, 264, 336];
    let result = 0;

    for (let i = 0; i != str.length; i++)
        result += str.charCodeAt(i);
    result *= 1.5;

    for (let i = hashRef.length - 1; i !== -1; i--)
        if (hashRef[i] == result && colors.length > i)
            return colors[i];

    return result % 360;
}
