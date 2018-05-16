var applyEchart = (data) => {
    var element = document.querySelector('#tempRange')
    var myChart = echarts.init(element)

    var location = data['city']
    var minTemp = data['lowTemp']
    var maxTemp = data['highTemp']
    var date = data['date']

    option = {
        title: {
            text: location + '未来五天气温变化',
            subtext: '点击右侧按钮，即可改变样式'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data:['最高气温','最低气温']
        },
        toolbox: {
            show: true,
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                dataView: {readOnly: false},
                magicType: {type: ['line', 'bar']},
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis:  {
            type: 'category',
            boundaryGap: false,
            data: date
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value} °C'
            }
        },
        series: [
            {
                name:'最高气温',
                type:'line',
                data: maxTemp,
                markPoint: {
                    data: [
                        {type: 'max', name: '最大值'},
                        {type: 'min', name: '最小值'}
                    ]
                },
                markLine: {
                    data: [
                        {type: 'average', name: '平均值'}
                    ]
                }
            },
            {
                name:'最低气温',
                type:'line',
                data: minTemp,
                markPoint: {
                    data: [
                        {name: '周最低', value: -2, xAxis: 1, yAxis: -1.5}
                    ]
                },
                markLine: {
                    data: [
                        {type: 'average', name: '平均值'},
                        [{
                            symbol: 'none',
                            x: '90%',
                            yAxis: 'max'
                        }, {
                            symbol: 'circle',
                            label: {
                                normal: {
                                    position: 'start',
                                    formatter: '最大值'
                                }
                            },
                            type: 'max',
                            name: '最高点'
                        }]
                    ]
                }
            }
        ]
    };

    myChart.setOption(option)
}

var log = console.log.bind(console)

var eleSelector = function(selector) {
    var element = document.querySelector(selector)
    if (element == null) {
        var s = `Can't find element,maybe selector ${selector} isn't found out. Or js isn't put in body.`
        alert(s)
    } else {
        return element
    }
}

var ajax = function(method, path, data, callback) {
    var r = new XMLHttpRequest()
    r.open(method, path, true)
    r.onreadystatechange = function() {
        if (r.readyState == 4) {
            callback(r.response)
        }
    }
    r.send(data)
}

var apiGetForecast = (path, callback) => {
    var url = 'https://free-api.heweather.com/s6/weather/forecast?' + path
    ajax('GET', url, '', (r) => {
        var data = JSON.parse(r)
        callback(data)
    })
}

var randomList = function(quantity) {
    var list = new Set()
    while (list.size != quantity) {
        var anynum = Math.random()
        anynum = anynum * quantity
        var songIndex = Math.floor(anynum)
        list.add(songIndex)
    }

    var randomArray = Array.from(list)
    return randomArray
}

var tempNew = function (data, fore) {
    var foreTotal = []
    for (var i = 0; i < data.length; i++) {
        var dataEach = Number(data[i]);
        foreTotal.push(dataEach)
    }

    for (var j = 0; j < fore.length; j++) {
        var foreEach = fore[j];
        var foreTotalEach = foreTotal[j]
        var mix = foreTotalEach + foreEach
        foreTotal.push(mix)
    }

    return foreTotal
}

var dateNew = (date) => {
    var today = new Date()
    var weekday = today.getDay()
    var weekdayCN = ['星期天', '星期一', '星期二',  '星期三', '星期四', '星期五', '星期六']
    var nextSixDay = []
    while (nextSixDay.length != 6) {
        var todayCN = weekdayCN[weekday]
        nextSixDay.push(todayCN)
        weekday += 1
        if (weekday == 7) {
            weekday = 0
        }
    }

    return nextSixDay
}

var forecastData = (data) => {
    var city = data[0]
    var forecast = randomList(data[1].length)
    var lowTemp = tempNew(data[1], forecast)
    var highTemp = tempNew(data[2], forecast)
    var date = dateNew(data[3])

    return {
        city,
        lowTemp,
        highTemp,
        date,
    }
}

var cleanDataForecast = (data) => {
    var daily = data['HeWeather6'][0]
    var location = daily['basic']['location']
    var forecast = daily['daily_forecast']
    var minTemp = []
    for (var i = 0; i < forecast.length; i++) {
        var datum = forecast[i];
        var min = datum['tmp_min']
        minTemp.push(min)
    }

    //get the array of max temperature.
    var maxTemp = []
    for (var j = 0; j < forecast.length; j++) {
        var element = forecast[j];
        var max = element['tmp_max']
        maxTemp.push(max)
    }

    //get the date
    var date = []
    for (var j = 0; j < forecast.length; j++) {
        var d = forecast[j];
        var max = d['date']
        date.push(max)
    }

    var database = [location, minTemp, maxTemp, date]
    return database
}

var cleanDataWear = (data) => {
    var daily = data['HeWeather6']['0']
    var lifestyle = daily['lifestyle']['1']
    var wearAdvice = lifestyle['txt']

    return wearAdvice
}

var WeatherForecast = (city, key) => {
    var para = `location=${city}&key=${key}`
    apiGetForecast(para, (data) => {
        var freshData = cleanDataForecast(data)
        var totalData = forecastData(freshData)
        applyEchart(totalData)
    })
}

var apiGetWear = (para, callback) => {
    var url = 'https://free-api.heweather.com/s6/weather/lifestyle?' + para
    ajax('GET', url, '', (r) => {
        var data = JSON.parse(r)
        callback(data)
    })
}

var wearInWeb = (data) => {
    var text = eleSelector('.wearIndex p')
    text.innerHTML = data
}

var wearIndex = (city, key) => {
    var para = `location=${city}&key=${key}`
    apiGetWear(para, (data) => {
        var freshData = cleanDataWear(data)
        wearInWeb(freshData)
    })
}

var apiGetNow = (para, callback) => {
    var url = 'https://free-api.heweather.com/s6/weather/now?' + para
    ajax('GET', url, '', (r) => {
        var data = JSON.parse(r)
        callback(data)
    })
}

var getWeekday = (time) => {
    var proto = time.slice(5, 10)
    if (proto[0] == '0') {
        proto = proto.slice(1)
    }

    return proto
}

var insertCity = (city, time) => {
    var h1 = eleSelector('header h1')
    var today = getWeekday(time)
    h1.innerHTML = city + '  ' + today
}

var insertWeatherCode = (code) => {
    var weatherCode = eleSelector('.weatherCondition img')
    weatherCode.src = `./condIcon/${code}.png`
}

var createHourMinute = (time) => {
    var hourMinute = time.slice(-5)
    return hourMinute
}

var insertTempUpdate = (temp, updateTime) => {
    var tempEle = eleSelector('.weatherCondition h2')
    tempEle.innerHTML = `${temp} ℃`

    var formalTime = createHourMinute(updateTime)
    var updateTimeEle = eleSelector('.weatherCondition p')
    updateTimeEle.innerHTML = `数据更新时间：${formalTime} 分`
}

var cleanDataNow = (data) => {
    // log('cleanDataNow:data', data)
    var protoData = data['HeWeather6']['0']
    var city = protoData['basic']['location']
    var updateTime = protoData['update']['loc']

    var now = protoData['now']
    var weatherCode = now['cond_code']
    var tempNow = now['tmp']

    var datapackNow = {
        city,
        weatherCode,
        tempNow,
        updateTime,
    }
    log('datapackNow',datapackNow)
    return datapackNow
}

var weatherNowInWeb = (data) => {
    insertCity(data['city'], data['updateTime'])
    insertWeatherCode(data['weatherCode'])
    insertTempUpdate(data['tempNow'], data['updateTime'])
}

var weatherNow = (city, key) => {
    var para = `location=${city}&key=${key}`
    apiGetNow(para, (data) => {
        var freshData = cleanDataNow(data)
        weatherNowInWeb(freshData)
    })
}

var renderWeatherAll = (city) => {
    var key = '94848bcb12e64c18b3b421dcab111ee2'
    WeatherForecast(city, key)
    wearIndex(city, key)
    weatherNow(city, key)
}

var wearIndex = (city, key) => {
    var para = `location=${city}&key=${key}`
    apiGetWear(para, (data) => {
        var freshData = cleanDataWear(data)
        wearInWeb(freshData)
    })
}

var editCity = (callback) => {
    var cityEle = eleSelector('header h1')
    cityEle.addEventListener('dblclick', function(event) {
        cityEle.contentEditable = true
        cityEle.focus()
    })

    cityEle.addEventListener('keydown', function(event) {
        if (event.key == 'Enter') {
            // Cancelling the enter key's default action.
            event.preventDefault()
            self.contentEditable = false
            var text = cityEle.innerHTML
            cityEle.classList.remove('titleSmall')
            callback(text)
        }
    })
}

function run() {
    log('in run')
    var image = document.getElementById('background');
    image.onload = function () {
        var engine = new RainyDay({
            image: this
        });
        engine.rain([
            [1, 2, 8000]
        ]);
        engine.rain([
            [3, 3, 0.88],
            [5, 5, 0.9],
            [6, 2, 1]
        ], 100);
    };
    image.crossOrigin = 'anonymous';
    image.src = './pic/cloud.jpeg';
}

var __main = () => {
    var cityText = editCity((city) => {
        renderWeatherAll(city)
    })

}

__main()