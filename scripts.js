(function () {
    var module = angular.module('App', []);

    module.controller('SensorsController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {

        $scope.init = false;
        $scope.firstRun = true;
        $scope.loading = undefined;
        $scope.sensors = undefined;
        $scope.graph1Data = [];
        $scope.graph2Data = [];

        $scope.load = function () {
            $scope.loading = true;

            $http({ url: 'sensors.php' }).then(function (response) {
                $scope.sensors = response.data;

                $timeout($scope.do, 10);

                $scope.loading = false;
                $scope.init = true;
            }, function (error) {
                $scope.loading = false;
            });
        };

        $scope.autoLoad = function () {
            if (!$scope.loading) {
                $scope.load();
            }
            $timeout($scope.autoLoad, 30000);
        };

        $scope.poolDiff = function () {
            if ($scope.sensors === undefined) {
                return undefined;
            }
            return Math.round(($scope.sensors.tempHeater.data.Temp - $scope.sensors.tempPool.data.Temp) * 10) / 10;
        };

        $scope.getUTCFromString = function (s) {
            return Date.UTC(
                parseInt(s.substring(0, 4), 10),
                parseInt(s.substring(5, 7), 10) - 1,
                parseInt(s.substring(8, 10), 10),
                parseInt(s.substring(11, 13), 10),
                parseInt(s.substring(14, 16), 10),
                0
            );
        };

        $scope.tempToF = function (tempC) {
            return Math.round((9 / 5 * tempC) + 32);
        };

        $scope.graph = function (element, title, series, yAxisConfig) {

            var yAxis = [{
                labels: {
                    formatter: function () {
                        return this.value + '\u00B0 ';
                    }
                },
                title: {
                    text: 'degrees '
                }
            }];

            if (yAxisConfig !== undefined && yAxisConfig[0] !== undefined) {
                yAxis.push(yAxisConfig[0]);
            }
            if (yAxisConfig !== undefined && yAxisConfig[1] !== undefined) {
                yAxis.push(yAxisConfig[1]);
            }

            return $(element).highcharts({
                chart: {
                    type: 'line',
                    zoomType: 'x',
                    resetZoomButton: {
                        position: {
                            x: -30,
                            y: -36
                        }
                    },
                    alignTicks: false,
                },
                title: {
                    text: title
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: yAxis,
                tooltip: {
                    crosshairs: true,
                    shared: true
                },
                legend: {
                    enabled: true
                },
                plotOptions: {
                    series: {
                        animation: true,
                        point: {
                            events: {
                                click: function (event) {
                                    chartPointClickNew(event, true, ShowTempLog);
                                }
                            }
                        }
                    },
                    line: {
                        lineWidth: 3,
                        states: {
                            hover: {
                                lineWidth: 3
                            }
                        },
                        marker: {
                            enabled: false,
                            states: {
                                hover: {
                                    enabled: true,
                                    symbol: 'circle',
                                    radius: 5,
                                    lineWidth: 1
                                }
                            }
                        }
                    }
                },
                series: series,
                credits: {
                    enabled: false
                }
            }).highcharts();
        };

        $scope.do = function () {

            var piscineData = [];
            $scope.sensors.tempPool.graph.result.forEach(function (item) {
                piscineData.push([$scope.getUTCFromString(item.d), parseFloat(item.te)]);
            });

            var piscine2Data = [];
            $scope.sensors.tempHeater.graph.result.forEach(function (item) {
                piscine2Data.push([$scope.getUTCFromString(item.d), parseFloat(item.te)]);
            });

            var extData = [];
            $scope.sensors.tempOut.graph.result.forEach(function (item) {
                extData.push([$scope.getUTCFromString(item.d), parseFloat(item.te)]);
            });

            var luxData = [];
            if ($scope.sensors.lux.graph.result != undefined) {
                $scope.sensors.lux.graph.result.forEach(function (item) {
                    luxData.push([$scope.getUTCFromString(item.d), parseInt(item.lux)]);
                });
            }

            var energyData = [];
            if ($scope.sensors.energy.graph.result != undefined) {
                $scope.sensors.energy.graph.result.forEach(function (item) {
                    energyData.push([$scope.getUTCFromString(item.d), parseInt(item.u)]);
                });
            }

            var flowData = [];
            if ($scope.sensors.flow.graph.result != undefined) {
                $scope.sensors.flow.graph.result.forEach(function (item) {
                    flowData.push([$scope.getUTCFromString(item.d), parseFloat(item.v)]);
                });
            }

            $scope.graph1Data = [{
                id: 'temperature',
                name: 'Temp. Pool',
                color: '#002366',
                yAxis: 0,
                tooltip: {
                    valueSuffix: ' \u00B0',
                    valueDecimals: 1
                },
                data: piscineData
            }, {
                    id: 'temperature2',
                    name: 'Temp. Heat',
                    color: '#FF4500',
                    yAxis: 0,
                    tooltip: {
                        valueSuffix: ' \u00B0',
                        valueDecimals: 1
                    },
                    data: piscine2Data
                }, {
                    id: 'energy',
                    name: 'Energy',
                    color: '#FFBF00',
                    yAxis: 1,
                    tooltip: {
                        valueSuffix: ' W',
                        valueDecimals: 0
                    },
                    data: energyData
                }, {
                    id: 'flow',
                    name: 'Flow',
                    color: '#0000FF',
                    yAxis: 2,
                    tooltip: {
                        valueSuffix: ' l/min',
                        valueDecimals: 1
                    },
                    data: flowData
                }];

            $scope.graph2Data = [{
                id: 'temperature',
                name: 'Temperature',
                color: '#002366',
                yAxis: 0,
                tooltip: {
                    valueSuffix: ' \u00B0',
                    valueDecimals: 1
                },
                data: extData
            }, {
                    id: 'lux',
                    name: 'Lux',
                    color: '#FFBF00',
                    yAxis: 1,
                    data: luxData
                }];

            if($('#graph').length == 0) {
                // No graphs
                return;
            }

            if ($scope.firstRun) {
                $scope.graph1 = $scope.graph('#graph', 'Pool', $scope.graph1Data, [{
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null,
                    }
                    //	opposite: true
                }, {
                        labels: {
                            enabled: false
                        },
                        title: {
                            text: null,
                        }
                        //	opposite: true
                    }]);

                $scope.graph2 = $scope.graph('#graph2', 'Outside', $scope.graph2Data, [{
                    labels: {
                        enabled: false
                    },
                    title: {
                        text: null,
                    },
                    max: 50001
                }]);

                $scope.firstRun = false;
            } else {
                for (var i = 0; i < $scope.graph1Data.length; i++) {
                    $scope.graph1.series[i].setData($scope.graph1Data[i].data, true, true, true);
                }
                for (var i = 0; i < $scope.graph2Data.length; i++) {
                    $scope.graph2.series[i].setData($scope.graph2Data[i].data, true, true, true);
                }

                //$scope.graph1.redraw();
                //$scope.graph2.redraw();
            }
        };


        $scope.detail = function(item) {
            console.log('Detail for : ' + item);

            $http({url:'https://meteo.gc.ca/rss/city/qc-76_f.xml'}).then(function(response){
                console.log(response);
            });
        };


        $scope.autoLoad();

    }]);



})();
