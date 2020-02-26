declare var GIF: any;  // for https://github.com/jnordberg/gif.js

module framework {
    export class FileParser {
        private filename: string;
        private content: string[][];
        private y: number;
        private x: number

        constructor(filename: string, content: string) {
            this.filename = filename;
            this.content = [];
            for (const line of content.split('\n')) {
                const words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }

        public getWord(): string {
            if (this.content.length <= this.y) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            const word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        }
        public getInt(): number {
            const word = this.getWord();
            if (! word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError(`a number expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            return parseInt(word);
        }
        public getFloat(): number {
            const word = this.getWord();
            if (! word.match(new RegExp('^[-+]?[0-9]+(?:\.[0-9]+)?$'))) {
                this.reportError(`a number expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            return parseFloat(word);
        }
        public getNewline() {
            if (this.content.length <= this.y) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError(`newline expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            this.x = 0;
            this.y += 1;
        }

        public unwind() {
            if (this.x == 0) {
                this.y -= 1;
                this.x = this.content[this.y].length - 1;
            } else {
                this.x -= 1;
            }
        }
        public reportError(msg: string) {
            msg = `${this.filename}: line ${this.y + 1}: ${msg}`;
            alert(msg);
            throw new Error(msg);
        }
    }

    export class FileSelector {
        public callback: (inputContent: string, outputContent: string) => void;

        private inputFile: HTMLInputElement;
        private outputFile: HTMLInputElement;
        private reloadButton: HTMLInputElement;

        constructor() {
            this.inputFile = <HTMLInputElement> document.getElementById("inputFile");
            this.outputFile = <HTMLInputElement> document.getElementById("outputFile");
            this.reloadButton = <HTMLInputElement> document.getElementById("reloadButton");

            this.reloadFilesClosure = () => { this.reloadFiles(); };
            this. inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }

        private reloadFilesClosure: () => void;
        reloadFiles() {
            if (this.inputFile.files.length == 0 || this.outputFile.files.length == 0) return;
            loadFile(this.inputFile.files[0], (inputContent: string) => {
                loadFile(this.outputFile.files[0], (outputContent: string) => {
                    this. inputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.outputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.reloadButton.classList.remove('disabled');
                    if (this.callback !== undefined) {
                        this.callback(inputContent, outputContent);
                    }
                });
            });
        }
    }

    export class RichSeekBar {
        public callback: (value: number) => void;

        private seekRange: HTMLInputElement;
        private seekNumber: HTMLInputElement;
        private fpsInput: HTMLInputElement;
        private firstButton: HTMLInputElement;
        private prevButton: HTMLInputElement;
        private playButton: HTMLInputElement;
        private nextButton: HTMLInputElement;
        private lastButton: HTMLInputElement;
        private runIcon: HTMLElement;
        private intervalId: number;
        private playClosure: () => void;
        private stopClosure: () => void;

        constructor() {
            this.seekRange  = <HTMLInputElement> document.getElementById("seekRange");
            this.seekNumber = <HTMLInputElement> document.getElementById("seekNumber");
            this.fpsInput = <HTMLInputElement> document.getElementById("fpsInput");
            this.firstButton = <HTMLInputElement> document.getElementById("firstButton");
            this.prevButton = <HTMLInputElement> document.getElementById("prevButton");
            this.playButton = <HTMLInputElement> document.getElementById("playButton");
            this.nextButton = <HTMLInputElement> document.getElementById("nextButton");
            this.lastButton = <HTMLInputElement> document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;

            this.setMinMax(-1, -1);
            this.seekRange .addEventListener('change', () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('change', () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.seekRange .addEventListener('input',  () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('input',  () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.fpsInput.addEventListener('change', () => { if (this.intervalId !== null) { this.play(); } });
            this.firstButton.addEventListener('click', () => { this.stop(); this.setValue(this.getMin()); });
            this.prevButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() - 1); });
            this.nextButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() + 1); });
            this.lastButton .addEventListener('click', () => { this.stop(); this.setValue(this.getMax()); });
            this.playClosure = () => { this.play(); };
            this.stopClosure = () => { this.stop(); };
            this.playButton.addEventListener('click', this.playClosure);
        }

        public setMinMax(min: number, max: number) {
            this.seekRange.min   = this.seekNumber.min   = min.toString();
            this.seekRange.max   = this.seekNumber.max   = max.toString();
            this.seekRange.step  = this.seekNumber.step  = '1';
            this.setValue(min);
        }
        public getMin(): number {
            return parseInt(this.seekRange.min);
        }
        public getMax(): number {
            return parseInt(this.seekRange.max);
        }

        public setValue(value: number) {
            value = Math.max(this.getMin(),
                    Math.min(this.getMax(), value));  // clamp
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value);
            }
        }
        public getValue(): number {
            return parseInt(this.seekRange.value);
        }

        public getDelay(): number {
            const fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        }
        private resetInterval() {
            if (this.intervalId !== undefined) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        }
        public play() {
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.   addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) {  // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(() => {
                if (this.getValue() == this.getMax()) {
                    this.stop();
                } else {
                    this.setValue(this.getValue() + 1);
                }
            }, this.getDelay());
        }
        public stop() {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.   addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        }
    }

    const loadFile = (file: File, callback: (value: string) => void) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            callback(reader.result as string);
        }
    };

    const saveUrlAsLocalFile = (url: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        const evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };

    export class FileExporter {
        constructor(canvas: HTMLCanvasElement, seek: RichSeekBar) {
            const saveAsImage = <HTMLInputElement> document.getElementById("saveAsImage");
            const saveAsVideo = <HTMLInputElement> document.getElementById("saveAsVideo");

            saveAsImage.addEventListener('click', () => {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });

            saveAsVideo.addEventListener('click', () => {
                if (location.href.match(new RegExp('^file://'))) {
                    alert('to use this feature, you must re-open this file via "http://", instead of "file://". e.g. you can use "$ python -m SimpleHTTPServer 8000"');
                }
                seek.stop();
                const gif = new GIF();
                for (let i = seek.getMin(); i < seek.getMax(); ++ i) {
                    seek.setValue(i);
                    gif.addFrame(canvas, { copy: true, delay: seek.getDelay() });
                }
                gif.on('finished', function(blob) {
                    saveUrlAsLocalFile(URL.createObjectURL(blob), 'canvas.gif');
                });
                gif.render();
                alert('please wait for a while, about 2 minutes.');
            });
        }
    }
}

module visualizer {
    interface Point {
        x: number;
        y: number;
    }

    class InputFile {
        public points: Point[];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            // parse
            const N = parser.getInt();
            parser.getNewline();
            if (N < 3) alert("<tester>: number of points is so small");
            this.points = [];
            for (let i = 0; i < N; ++ i) {
                const x = parser.getFloat();
                const y = parser.getFloat();
                parser.getNewline();
                this.points.push({ x, y });
            }
        }
    };

    class OutputFile {
        public order: number[];

        constructor(inputContent: string, content: string) {
            const inputParser = new framework.FileParser('<input-file>', inputContent);
            const parser = new framework.FileParser('<output-file>', content);

            // parse
            const N = inputParser.getInt();
            this.order = [];
            let visited: boolean[] = new Array(N);
            for (let i = 0; i < N; ++ i) {
                const p = parser.getInt();

                if (p < 0 || p >= N) alert("<tester>: index out of range");
                if (visited[p]) alert("<tester>: reached the same vertex twice");

                this.order.push(p);
                visited[p] = true;
            }
            parser.getNewline();
        }
    };

    class Visualizer {
        private canvas: HTMLCanvasElement;
        private ctx: CanvasRenderingContext2D;
        private visitingInput: HTMLInputElement;
        private penaltyDeltaInput: HTMLInputElement;
        private penaltySumInput: HTMLInputElement;
        private transformX: (x: number) => number;
        private transformY: (y: number) => number;
        private pointSize: number;
        private pointSize2: number;

        public N: number;
        private idx: number;
        private order: number[];
        private points: Point[];
        private penaltyDelta: number | null;
        private penaltySum: number;

        constructor() {
            this.canvas = <HTMLCanvasElement> document.getElementById("canvas");  // TODO: IDs should be given as arguments
            this.canvas.height = 800;  // pixels
            this.canvas.width  = 800;  // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.visitingInput = <HTMLInputElement> document.getElementById("visitingInput");
            this.penaltyDeltaInput = <HTMLInputElement> document.getElementById("penaltyDeltaInput");
            this.penaltySumInput = <HTMLInputElement> document.getElementById("penaltySumInput");
        }

        public init(input: InputFile, output: OutputFile) {
            this.points = input.points;
            this.order = output.order;
            this.N = this.order.length;

            let minX = 1000000;
            let maxX = -1000000;
            let minY = 1000000;
            let maxY = -1000000;
            const updateMinMaxXY = (x: number, y: number) => {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            };
            for (const point of this.points) {
                updateMinMaxXY(point.x, point.y);
            }
            const size = Math.max(maxX - minX, maxY - minY);
            const centerX = (maxX + minX) / 2;
            const centerY = (maxY + minY) / 2;
            const scale = (this.canvas.height - 50) / size;  // height == width
            this.pointSize = Math.max(1, Math.min(20, Math.round(120 / Math.sqrt(this.N))));
            this.pointSize2 = Math.floor(this.pointSize / 2);
            this.transformX = (x: number) => {
                return Math.round((x - centerX) * scale + this.canvas.width / 2);
            };
            this.transformY = (y: number) => {
                return Math.round(-(y - centerY) * scale + this.canvas.height / 2);
            };

            this.reInit();
        }

        public reInit() {
            const drawPixel = (x: number, y: number) => {
                this.ctx.fillRect(this.transformX(x) - this.pointSize2, this.transformY(y) - this.pointSize2, this.pointSize, this.pointSize);
            };

            this.idx = -1;
            this.penaltyDelta = null;
            this.penaltySum = 0;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.height, this.canvas.height);
            this.ctx.fillStyle = 'black';
            for (const point of this.points) {
                drawPixel(point.x, point.y);
            }
        }

        public drawNext() {
            // update
            ++this.idx;
            const cur = this.points[this.order[this.idx % this.N]];
            const prv = this.idx > 0 ? this.points[this.order[this.idx - 1]] : null;
            if (prv != null) {
                const dx = cur.x - prv.x;
                const dy = cur.y - prv.y;
                this.penaltyDelta = Math.round(Math.sqrt(dx * dx + dy * dy) + 1e-9);
                this.penaltySum += this.penaltyDelta;
            }

            this.visitingInput.value = this.order[this.idx % this.N].toString();
            this.penaltyDeltaInput.value = this.penaltyDelta == null ? "" : this.penaltyDelta.toString();
            this.penaltySumInput.value = this.penaltySum.toString();

            const drawPixel = (x: number, y: number) => {
                this.ctx.fillRect(this.transformX(x) - this.pointSize2, this.transformY(y) - this.pointSize2, this.pointSize, this.pointSize);
            };

            // fill current point
            this.ctx.fillStyle = 'red';
            drawPixel(cur.x, cur.y);

            // draw line
            if (prv != null) {
                this.ctx.strokeStyle = 'blue';
                this.ctx.lineWidth = 1;
                this.drawArrow(prv, cur);
                this.ctx.fillStyle = 'gray';
                drawPixel(prv.x, prv.y);
            }
        }
        public draw(value: number) {
            if (this.idx > value) this.reInit();
            while (this.idx < value) this.drawNext();
        }

        public drawArrow(prv: Point, cur: Point) {
            const dx = cur.x - prv.x;
            const dy = cur.y - prv.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            const vx = dx / mag;
            const vy = -dy / mag;
            const sx = this.transformX(cur.x) - vx * this.pointSize2;
            const sy = this.transformY(cur.y) - vy * this.pointSize2;

            this.ctx.beginPath();
            this.ctx.moveTo(this.transformX(prv.x), this.transformY(prv.y));
            this.ctx.lineTo(sx, sy);
            this.ctx.stroke();

            const drawLine = (angle: number) => {
                const px = (vx * Math.cos(angle) - vy * Math.sin(angle)) * this.pointSize;
                const py = (vx * Math.sin(angle) + vy * Math.cos(angle)) * this.pointSize;
                this.ctx.beginPath();
                this.ctx.moveTo(sx, sy);
                this.ctx.lineTo(sx + px, sy + py);
                this.ctx.stroke();
            };
            drawLine(Math.PI * 6 / 7);
            drawLine(Math.PI * 8 / 7);
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }
    };

    export class App {
        public visualizer: Visualizer;
        public loader: framework.FileSelector;
        public seek: framework.RichSeekBar;
        public exporter: framework.FileExporter;
        private input: InputFile;
        private output: OutputFile;

        constructor() {
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.seek = new framework.RichSeekBar();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas(), this.seek);

            this.seek.callback = (value: number) => {
                this.visualizer.draw(value);
            };

            this.loader.callback = (inputContent: string, outputContent: string) => {
                this.input = new InputFile(inputContent);
                this.output = new OutputFile(inputContent, outputContent);
                this.visualizer.init(this.input, this.output);
                this.seek.setMinMax(0, this.visualizer.N);
                this.seek.setValue(0);
                this.seek.play();
            }
        }
    }
}

window.onload = () => {
    new visualizer.App();
};
