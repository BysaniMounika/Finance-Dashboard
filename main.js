let params = {
    volumeData: {}
};
let canvas, canvasVolume;
let context, contextVolume;
let chart, chartVolume; 

$(document).ready(function() {
    $("#price-data-tab").load("html/price-data.html", function(data) {
        canvas = document.getElementById("chart");
        context = canvas.getContext('2d');
        chart = null;
        $("#date-range").daterangepicker();
    }); 
    $("#volume-data-tab").load("html/volume-data.html", function(data) {
        canvasVolume = document.getElementById("chart-volume");
        contextVolume = canvasVolume.getContext('2d');
        chartVolume = null;
        $("#single-date").daterangepicker({
            singleDatePicker: true,
            showDropdowns: true
        });
        $("#single-date").on('apply.daterangepicker', function(ev, picker) {
            console.log("Selected Date: ", picker.startDate.format('YYYY-MM-DD'));
            params.volumeData.date = picker.startDate.format('YYYY-MM-DD');
            getVolumeData();
        });
    }); 
    getExchanges();
});

function getExchanges() {
    fetch("https://cs5600.azurewebsites.net/api/exchange", {
        method: 'GET',
        headers:{
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log("Exchanges:", data);
        data.forEach(element => {
            $("#exchange-dropdown").append(`<a class="dropdown-item" href="#" onclick="getCompanies(this, ${element.id});">${element.name}</a>`);
            $("#exchange-dropdown-volume-tab").append(`<a class="dropdown-item" href="#" onclick="updateExchangeButton(this, ${element.id});">${element.name}</a>`);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function getCompanies(element, exchangeId) {
    $("#exchange-button").text($(element).text());
    params.exchangeId = exchangeId;
    fetch(`https://cs5600.azurewebsites.net/api/exchange/${exchangeId}/companies`, {
        method: 'GET',
        headers:{
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log("Companies:", data);
        $("#companies-button").text("Select Company");
		$("#company-dropdown").empty();
        data.forEach(x => {
            $("#company-dropdown").append(`<a class="dropdown-item" href="#" onclick="getTimeFrame(this, ${x.id});">${x.name}</a>`);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function getTimeFrame(element, companyId) {
    $("#companies-button").text($(element).text());
    params.companyId = companyId;
    fetch(`https://cs5600.azurewebsites.net/api/company/${companyId}`, {
        method: 'GET',
        headers:{
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log("TimeFrame:", data);
        params.minDate = new Date(data.startDate);
        params.maxDate = new Date(data.endDate);
        console.log("minDate:", params.minDate);
        console.log("maxDate:", params.maxDate);
        $("#date-range").daterangepicker({
            minDate: params.minDate,
            maxDate: params.maxDate,
            startDate: params.minDate,
            endDate: params.maxDate
        }); 
        $("#date-range").on('apply.daterangepicker', function(ev, picker) {
            console.log("StartDate: ", picker.startDate.format('YYYY-MM-DD'));
            console.log("EndDate: ", picker.endDate.format('YYYY-MM-DD'));
            params.startDate = picker.startDate.format('YYYY-MM-DD');
            params.endDate = picker.endDate.format('YYYY-MM-DD');
            getData();
        });
    })
    .catch((error) => {
        console.error('Error:', error);
        clearChartAndTable();
    });
}

function getData() {
    fetch(`https://cs5600.azurewebsites.net/api/company/${params.companyId}/prices/${params.startDate}/${params.endDate}`, {
        method: 'GET',
        headers:{
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log("Price Data", data);
        generateChartAndTable(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function clearChartAndTable() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    chart.destroy();
    $("#tbody-price-tab").empty();
}

function generateChartAndTable(data) {
   	if (chart != null) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        chart.destroy();
		$("#tbody-price-tab").empty();
   	}

    let labels = [];
    let open = [];
	let close = [];
	let low = [];
	let high = [];
	let volume = [];
    let date;
	
	data.forEach(element => {
		date = new Date(element.date).toLocaleDateString("en-US");
		
		labels.push(date);
		open.push(element.open);
		close.push(element.close);
		low.push(element.low);
		high.push(element.high);
		volume.push(element.volume);

		$("#tbody-price-tab").append(`
			<tr>
				<td>${date}</td>
				<td>${element.open}</td>
				<td>${element.high}</td>
				<td>${element.low}</td>
				<td>${element.close}</td>
				<td>${element.volume}</td>
			</tr>
		`);
	});
    
    chart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    data: high,
                    label: "High",
                    borderColor: "rgb(62,149,205)",
                    backgroundColor: "rgba(62,149,205,0.1)",
					borderWidth: 1,
					yAxisID: "price-axis",
					pointRadius: 0
                },
                {
                    data: low,
                    label: "Low",
                    borderColor: "rgb(60,186,159)",
                	backgroundColor: "rgba(60,186,159,0.1)",
					// fill: true,
					borderWidth: 1,
					yAxisID: "price-axis",
					pointRadius: 0
                },
                {
                    data: close,
                    label: "Close",
                    borderColor: "rgb(255, 165, 0)",
                	backgroundColor: "rgba(255, 165, 0, 0.1)",
					borderWidth: 1,
					yAxisID: "price-axis",
					pointRadius: 0
                },
                {
                    data: open,
                    label: "Open",
					borderColor: "rgb(196, 88, 80)",
					backgroundColor: "rgba(196, 88, 80, 0.1)",
					// fill: true,
					borderWidth: 1,
					yAxisID: "price-axis",
					pointRadius: 0
                }, 
				{
					data: volume,
                    label: "Voulme",
					backgroundColor: "rgba(153, 102, 255, 0.2)",
					borderColor: "rgb(153, 102, 255)",
					borderWidth: 1,
					type: "bar",
					yAxisID: "volume-axis"
				}
            ],
        },
		options: {
			scales: {
				"price-axis": {
					type: "linear",
					position: "left"
				},
				"volume-axis": {
					type: "linear",
					position: "right"
				}
			}
		}
    });
}

function updateExchangeButton(element, exchangeId) {
    params.volumeData.exchangeId = exchangeId;
    $("#exchange-button-volume-tab").text($(element).text());
}

function getVolumeData() {
    fetch(`https://cs5600.azurewebsites.net/api/exchange/${params.volumeData.exchangeId}/${params.volumeData.date}`, {
        method: 'GET',
        headers:{
            "Content-Type": "application/json",
        }
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        console.log("Volume Data", data);
        generateVolumeChartAndTable(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function generateVolumeChartAndTable(data) {
    if (chartVolume != null) {
        contextVolume.clearRect(0, 0, canvasVolume.width, canvasVolume.height);
        chartVolume.destroy();
		$("#tbody-volume-tab").empty();
   	}

    let labels = [];
	let volumes = [];
    let colors = [];
	
	data.forEach(element => {
		labels.push(`${element.company.name}(${element.company.symbol})`);
		volumes.push(element.dailyVolume);
        colors.push(generateRandomColor());

		$("#tbody-volume-tab").append(`
			<tr>
				<td>${element.company.name}(${element.company.symbol})</td>
				<td>${element.dailyVolume}</td>
			</tr>
		`);
	});
    
    chartVolume = new Chart(contextVolume, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                { 
                    data: volumes,
                    backgroundColor: colors,
                    hoverOffset: 4
                },
            ]
        },
    });
}

function generateRandomColor() {
    // var randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
    // return randomColor;
    let n = (Math.random() * 0xfffff * 1000000).toString(16);
    return '#' + n.slice(0, 6);
}