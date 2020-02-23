var framework;
(function (framework) {
    var FileParser = /** @class */ (function () {
        function FileParser(filename, content) {
            this.filename = filename;
            this.content = [];
            for (var _i = 0, _a = content.split('\n'); _i < _a.length; _i++) {
                var line = _a[_i];
                var words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }
        FileParser.prototype.getWord = function () {
            if (this.content.length <= this.y) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            var word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        };
        FileParser.prototype.getInt = function () {
            var word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError("a number expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            return parseInt(word);
        };
        FileParser.prototype.getFloat = function () {
            var word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+(?:\.[0-9]+)?$'))) {
                this.reportError("a number expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            return parseFloat(word);
        };
        FileParser.prototype.getNewline = function () {
            if (this.content.length <= this.y) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError("newline expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            this.x = 0;
            this.y += 1;
        };
        FileParser.prototype.unwind = function () {
            if (this.x == 0) {
                this.y -= 1;
                this.x = this.content[this.y].length - 1;
            }
            else {
                this.x -= 1;
            }
        };
        FileParser.prototype.reportError = function (msg) {
            msg = this.filename + ": line " + (this.y + 1) + ": " + msg;
            alert(msg);
            throw new Error(msg);
        };
        return FileParser;
    }());
    framework.FileParser = FileParser;
    var FileSelector = /** @class */ (function () {
        function FileSelector() {
            var _this = this;
            this.inputFile = document.getElementById("inputFile");
            this.outputFile = document.getElementById("outputFile");
            this.reloadButton = document.getElementById("reloadButton");
            this.reloadFilesClosure = function () { _this.reloadFiles(); };
            this.inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }
        FileSelector.prototype.reloadFiles = function () {
            var _this = this;
            if (this.inputFile.files.length == 0 || this.outputFile.files.length == 0)
                return;
            loadFile(this.inputFile.files[0], function (inputContent) {
                loadFile(_this.outputFile.files[0], function (outputContent) {
                    _this.inputFile.removeEventListener('change', _this.reloadFilesClosure);
                    _this.outputFile.removeEventListener('change', _this.reloadFilesClosure);
                    _this.reloadButton.classList.remove('disabled');
                    if (_this.callback !== undefined) {
                        _this.callback(inputContent, outputContent);
                    }
                });
            });
        };
        return FileSelector;
    }());
    framework.FileSelector = FileSelector;
    var RichSeekBar = /** @class */ (function () {
        function RichSeekBar() {
            var _this = this;
            this.seekRange = document.getElementById("seekRange");
            this.seekNumber = document.getElementById("seekNumber");
            this.fpsInput = document.getElementById("fpsInput");
            this.firstButton = document.getElementById("firstButton");
            this.prevButton = document.getElementById("prevButton");
            this.playButton = document.getElementById("playButton");
            this.nextButton = document.getElementById("nextButton");
            this.lastButton = document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;
            this.setMinMax(-1, -1);
            this.seekRange.addEventListener('change', function () { _this.setValue(parseInt(_this.seekRange.value)); });
            this.seekNumber.addEventListener('change', function () { _this.setValue(parseInt(_this.seekNumber.value)); });
            this.seekRange.addEventListener('input', function () { _this.setValue(parseInt(_this.seekRange.value)); });
            this.seekNumber.addEventListener('input', function () { _this.setValue(parseInt(_this.seekNumber.value)); });
            this.fpsInput.addEventListener('change', function () { if (_this.intervalId !== null) {
                _this.play();
            } });
            this.firstButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getMin()); });
            this.prevButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getValue() - 1); });
            this.nextButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getValue() + 1); });
            this.lastButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getMax()); });
            this.playClosure = function () { _this.play(); };
            this.stopClosure = function () { _this.stop(); };
            this.playButton.addEventListener('click', this.playClosure);
        }
        RichSeekBar.prototype.setMinMax = function (min, max) {
            this.seekRange.min = this.seekNumber.min = min.toString();
            this.seekRange.max = this.seekNumber.max = max.toString();
            this.seekRange.step = this.seekNumber.step = '1';
            this.setValue(min);
        };
        RichSeekBar.prototype.getMin = function () {
            return parseInt(this.seekRange.min);
        };
        RichSeekBar.prototype.getMax = function () {
            return parseInt(this.seekRange.max);
        };
        RichSeekBar.prototype.setValue = function (value) {
            value = Math.max(this.getMin(), Math.min(this.getMax(), value)); // clamp
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value);
            }
        };
        RichSeekBar.prototype.getValue = function () {
            return parseInt(this.seekRange.value);
        };
        RichSeekBar.prototype.getDelay = function () {
            var fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        };
        RichSeekBar.prototype.resetInterval = function () {
            if (this.intervalId !== undefined) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        };
        RichSeekBar.prototype.play = function () {
            var _this = this;
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) { // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(function () {
                if (_this.getValue() == _this.getMax()) {
                    _this.stop();
                }
                else {
                    _this.setValue(_this.getValue() + 1);
                }
            }, this.getDelay());
        };
        RichSeekBar.prototype.stop = function () {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        };
        return RichSeekBar;
    }());
    framework.RichSeekBar = RichSeekBar;
    var loadFile = function (file, callback) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            callback(reader.result);
        };
    };
    var saveUrlAsLocalFile = function (url, filename) {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        var evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };
    var FileExporter = /** @class */ (function () {
        function FileExporter(canvas, seek) {
            var saveAsImage = document.getElementById("saveAsImage");
            var saveAsVideo = document.getElementById("saveAsVideo");
            saveAsImage.addEventListener('click', function () {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });
            saveAsVideo.addEventListener('click', function () {
                if (location.href.match(new RegExp('^file://'))) {
                    alert('to use this feature, you must re-open this file via "http://", instead of "file://". e.g. you can use "$ python -m SimpleHTTPServer 8000"');
                }
                seek.stop();
                var gif = new GIF();
                for (var i = seek.getMin(); i < seek.getMax(); ++i) {
                    seek.setValue(i);
                    gif.addFrame(canvas, { copy: true, delay: seek.getDelay() });
                }
                gif.on('finished', function (blob) {
                    saveUrlAsLocalFile(URL.createObjectURL(blob), 'canvas.gif');
                });
                gif.render();
                alert('please wait for a while, about 2 minutes.');
            });
        }
        return FileExporter;
    }());
    framework.FileExporter = FileExporter;
})(framework || (framework = {}));
var visualizer;
(function (visualizer) {
    var InputFile = /** @class */ (function () {
        function InputFile(content) {
            var parser = new framework.FileParser('<input-file>', content);
            // parse
            var N = parser.getInt();
            parser.getNewline();
            if (N < 3)
                alert("<tester>: number of points is so small");
            this.points = [];
            for (var i = 0; i < N; ++i) {
                var x = parser.getFloat();
                var y = parser.getFloat();
                parser.getNewline();
                this.points.push({ x: x, y: y });
            }
        }
        return InputFile;
    }());
    ;
    var OutputFile = /** @class */ (function () {
        function OutputFile(inputContent, content) {
            var inputParser = new framework.FileParser('<input-file>', inputContent);
            var parser = new framework.FileParser('<output-file>', content);
            // parse
            var N = inputParser.getInt();
            this.order = [];
            var visited = new Array(N);
            for (var i = 0; i < N; ++i) {
                var p = parser.getInt();
                if (p < 0 || p >= N)
                    alert("<tester>: index out of range");
                if (visited[p])
                    alert("<tester>: reached the same vertex twice");
                this.order.push(p);
                visited[p] = true;
            }
            parser.getNewline();
        }
        return OutputFile;
    }());
    ;
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.canvas = document.getElementById("canvas"); // TODO: IDs should be given as arguments
            this.canvas.height = 800; // pixels
            this.canvas.width = 800; // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.visitingInput = document.getElementById("visitingInput");
            this.penaltyDeltaInput = document.getElementById("penaltyDeltaInput");
            this.penaltySumInput = document.getElementById("penaltySumInput");
        }
        Visualizer.prototype.init = function (input, output) {
            var _this = this;
            this.points = input.points;
            this.order = output.order;
            this.N = this.order.length;
            var minX = 1000000;
            var maxX = -1000000;
            var minY = 1000000;
            var maxY = -1000000;
            var updateMinMaxXY = function (x, y) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            };
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                updateMinMaxXY(point.x, point.y);
            }
            var size = Math.max(maxX - minX, maxY - minY);
            var centerX = (maxX + minX) / 2;
            var centerY = (maxY + minY) / 2;
            var scale = (this.canvas.height - 50) / size; // height == width
            this.pointSize = Math.max(1, Math.min(40, Math.round(120 / Math.sqrt(this.N))));
            this.pointSize2 = Math.floor(this.pointSize / 2);
            this.transformX = function (x) {
                return Math.round((x - centerX) * scale + _this.canvas.width / 2);
            };
            this.transformY = function (y) {
                return Math.round(-(y - centerY) * scale + _this.canvas.height / 2);
            };
            this.reInit();
        };
        Visualizer.prototype.reInit = function () {
            var _this = this;
            var drawPixel = function (x, y) {
                _this.ctx.fillRect(_this.transformX(x) - _this.pointSize2, _this.transformY(y) - _this.pointSize2, _this.pointSize, _this.pointSize);
            };
            this.idx = -1;
            this.penaltyDelta = null;
            this.penaltySum = 0;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.height, this.canvas.height);
            this.ctx.fillStyle = 'black';
            for (var _i = 0, _a = this.points; _i < _a.length; _i++) {
                var point = _a[_i];
                drawPixel(point.x, point.y);
            }
        };
        Visualizer.prototype.drawNext = function () {
            var _this = this;
            // update
            ++this.idx;
            var cur = this.points[this.order[this.idx % this.N]];
            var prv = this.idx > 0 ? this.points[this.order[this.idx - 1]] : null;
            if (prv != null) {
                var dx = cur.x - prv.x;
                var dy = cur.y - prv.y;
                this.penaltyDelta = Math.round(Math.sqrt(dx * dx + dy * dy) + 1e-9);
                this.penaltySum += this.penaltyDelta;
            }
            this.visitingInput.value = this.order[this.idx % this.N].toString();
            this.penaltyDeltaInput.value = this.penaltyDelta == null ? "" : this.penaltyDelta.toString();
            this.penaltySumInput.value = this.penaltySum.toString();
            var drawPixel = function (x, y) {
                _this.ctx.fillRect(_this.transformX(x) - _this.pointSize2, _this.transformY(y) - _this.pointSize2, _this.pointSize, _this.pointSize);
            };
            // fill current point
            this.ctx.fillStyle = 'red';
            drawPixel(cur.x, cur.y);
            // draw line
            if (prv != null) {
                this.ctx.strokeStyle = 'blue';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(this.transformX(prv.x), this.transformY(prv.y));
                this.ctx.lineTo(this.transformX(cur.x), this.transformY(cur.y));
                this.ctx.stroke();
                this.drawArrow(prv, cur);
                this.ctx.fillStyle = 'gray';
                drawPixel(prv.x, prv.y);
            }
        };
        Visualizer.prototype.draw = function (value) {
            if (this.idx > value)
                this.reInit();
            while (this.idx < value)
                this.drawNext();
        };
        Visualizer.prototype.drawArrow = function (prv, cur) {
            var _this = this;
            var dx = cur.x - prv.x;
            var dy = cur.y - prv.y;
            var mag = Math.sqrt(dx * dx + dy * dy);
            var vx = dx / mag;
            var vy = -dy / mag;
            var sx = this.transformX(cur.x) - vx * this.pointSize2;
            var sy = this.transformY(cur.y) - vy * this.pointSize2;
            var drawLine = function (angle) {
                var px = (vx * Math.cos(angle) - vy * Math.sin(angle)) * _this.pointSize;
                var py = (vx * Math.sin(angle) + vy * Math.cos(angle)) * _this.pointSize;
                _this.ctx.beginPath();
                _this.ctx.moveTo(sx, sy);
                _this.ctx.lineTo(sx + px, sy + py);
                _this.ctx.stroke();
            };
            drawLine(Math.PI * 6 / 7);
            drawLine(Math.PI * 8 / 7);
        };
        Visualizer.prototype.getCanvas = function () {
            return this.canvas;
        };
        return Visualizer;
    }());
    ;
    var App = /** @class */ (function () {
        function App() {
            var _this = this;
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.seek = new framework.RichSeekBar();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas(), this.seek);
            this.seek.callback = function (value) {
                _this.visualizer.draw(value);
            };
            this.loader.callback = function (inputContent, outputContent) {
                _this.input = new InputFile(inputContent);
                _this.output = new OutputFile(inputContent, outputContent);
                _this.visualizer.init(_this.input, _this.output);
                _this.seek.setMinMax(0, _this.visualizer.N);
                _this.seek.setValue(0);
                _this.seek.play();
            };
        }
        return App;
    }());
    visualizer.App = App;
})(visualizer || (visualizer = {}));
window.onload = function () {
    new visualizer.App();
};
