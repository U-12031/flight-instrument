/** この関数は、取得したidを持つ要素を返します。
 * @param {string} id - 取得する要素のidです。
 * @returns {ElementObject} そのidを持つ要素です。
*/
function el(id) {return document.getElementById(id)};
const highScale = el("highScale").getContext("2d");
const bankScale = el("bankScale").getContext("2d");
const bankPointer = el("bankPointer").getContext("2d");
const symbol = el("symbol").getContext("2d");
const speedScale = el("speedScale").getContext("2d");
const altitudeScale = el("altitudeScale").getContext("2d");
const headingScale = el("headingScale").getContext("2d");
const headingPointer = el("headingPointer").getContext("2d");
const LINE_WIDTH = 3; // 目盛りの線の太さ

// canvasタグの画質を良くする
document.querySelectorAll("canvas").forEach((canvas) => {
	const ratio = window.devicePixelRatio ?? 1;
	canvas.width *= ratio;
	canvas.height *= ratio;
	canvas.style.width = (canvas.width / devicePixelRatio) + "px";
	canvas.style.height = (canvas.height / devicePixelRatio) + "px";
	canvas.getContext("2d").scale(ratio, ratio);
});

/** この関数は、要素に線を描画します。
 * @param {object} objective - 描画先の要素の描画コンテキストです。
 * @param {array} paths - 描画する線のパスです。[[x1, y1], [x2, y2]]のように配列で入力してください。
 * @param {boolean} [doClose=false] - 描画した線を閉じるかどうかを定義します。
 * @param {boolean} [doFill=false] - 描画した線を図形として塗りつぶすがどうかを定義します。これをtrueにするとき、必ずdoCloseもtrueにしてください。
*/
function drawLine(objective, paths, doClose=false, doFill=false) {
	const firstPath = paths[0];
	const otherPath = paths.slice(1);
	objective.beginPath();
	objective.moveTo(firstPath[0], firstPath[1]);
	for(const path of otherPath) {
		objective.lineTo(path[0], path[1]);
	};
	if(doClose) objective.closePath();
	objective.stroke();
	if(doFill) objective.fill();
}
/** この関数は、要素の中心に線を描画します。
 * @param {object} objective - 描画先の要素の描画コンテキストです。
 * @param {number} y - 描画する線の高さです。
 * @param {number} width - 描画する線の幅です。
 * @param {boolean} [doClose=true] - 描画した線を閉じるかどうかを定義します。
*/
function drawLineOnCenter(objective, y, width, doClose=true) {
	const centerStart = 700 - (width / 2);
	const centerEnd = 700 + (width / 2);
	objective.beginPath();
	objective.moveTo(centerStart, y);
	objective.lineTo(centerEnd, y);
	if(doClose) objective.closePath();
	objective.stroke();
}
/** この関数は、特定の円の円周上の点の座標を返します。
 * @param {array} circleCenter - 円の中心を[x, y]という形式で入力します。
 * @param {number} radius - 円の半径です。
 * @param {number} deg - 一般的にθで表される、始線(円の中心からx+方向に伸びる線)から反時計回りに回る角度です。
 * @returns {Array} - [x,y]の形の、指定した円の円周上の指定した角度の点の座標です。
 */
function onCircle(circleCenter, radius, deg) {
	const theta = deg * Math.PI / 180 // degをラジアンに変換

	let result = [,];
	result[0] = circleCenter[0] + radius * Math.cos(theta);
	result[1] = circleCenter[1] - radius * Math.sin(theta);

	return result;
}

highScale.fillStyle = "white";
highScale.font = "bold 25px \"numFont\"";
highScale.lineWidth = LINE_WIDTH;
highScale.strokeStyle = "white";

drawLineOnCenter(highScale, 697.5, 1400);

/** この関数は、addScaleOnCenter関数で描画したような目盛りの左右にラベルを付けます。上下の角度を表す目盛りのみに使われます。
 * @param {string} [text=""] - 描画するテキストです(英数半角2文字指定)。
 * @param {number} y - テキストのy座標です。描画したいところのy座標から10増やした値を入れます。
*/
function addScaleLabel(objective, text="", y) {
	objective.fillText(text, 560, y);
	objective.fillText(text, 820, y);
}
// 上下の角度を表す線を描く
for(let i=0;i<9;i++) { // 上方向
	let linePositionY = [];
	for(let j=0;j<4;j++) {
		linePositionY[j] = (-80*i) + (677.5 - 20*j)
	}
	drawLineOnCenter(highScale, linePositionY[0], 50);
	drawLineOnCenter(highScale, linePositionY[1], 100);
	drawLineOnCenter(highScale, linePositionY[2], 50);
	drawLineOnCenter(highScale, linePositionY[3], 200);
}
for(let i=0;i<9;i++) { // 下方向
	let linePositionY = [];
	for(let j=0;j<4;j++) {
		linePositionY[j] = (80*i) + (717.5 + 20*j);
	}
	drawLineOnCenter(highScale, linePositionY[0], 50);
	drawLineOnCenter(highScale, linePositionY[1], 100);
	drawLineOnCenter(highScale, linePositionY[2], 50);
	drawLineOnCenter(highScale, linePositionY[3], 200);
}
document.fonts.ready.then(() => { // フォントを読み込めたら目盛りの数字を描画する
	for(let i=0;i<9;i++) {
		addScaleLabel(highScale, `${(i+1)*10}`, -80*i + 627.5); // 上方向
		addScaleLabel(highScale, `${(i+1)*10}`, 80*i + 787.5); // 下方向
	}
});

bankScale.fillStyle = "white";
bankScale.lineWidth = LINE_WIDTH;
bankScale.strokeStyle = "white";

// 上のバンク角の目盛りを描く
const CIRCLES_CENTER = [200, 220]; // 基準となる3つの円の中心の座標(x,y)
const CIRCLE_RADIUS = { // 基準となる3つの円の半径
	basic: 200, // 全ての目盛りの内側の始点となる円
	short: 230, // 短い目盛りの外側の終点となる円
	long: 250 // 長い目盛りの外側の終点となる円
}
/** この関数は、ここでのみ使われる基準の一つである最も内側の円の円周上の点の座標を返します。
 * @param {number} deg - onCircle関数のdegと同じです。onCircle関数自身の引数degと混同しないように注意してください。
 * @returns {Array} [x,y]の形の、その円の円周上の指定した角度の点の座標です。
 */
function onBasicCircle(deg) {
	return onCircle(CIRCLES_CENTER, CIRCLE_RADIUS.basic, deg);
}
/** この関数は、ここでのみ使われる基準の一つである2番目の円の円周上の点の座標を返します。
 * @param {number} deg - onCircle関数のdegと同じです。onCircle関数自身の引数degと混同しないように注意してください。
 * @returns {Array} [x,y]の形の、その円の円周上の指定した角度の点の座標です。
 */
function onShortCircle(deg) {
	return onCircle(CIRCLES_CENTER, CIRCLE_RADIUS.short, deg);
}
/** この関数は、ここでのみ使われる基準の一つである最も外側の円の円周上の点の座標を返します。
 * @param {number} deg - onCircle関数のdegと同じです。onCircle関数自身の引数degと混同しないように注意してください。
 * @returns {Array} [x,y]の形の、その円の円周上の指定した角度の点の座標です。
 */
function onLongCircle(deg) {
	return onCircle(CIRCLES_CENTER, CIRCLE_RADIUS.long, deg);
}
// 上のバンク角の中央の三角形
drawLine(bankScale, [[185,0], [215,0], onBasicCircle(90)], true, true);
drawLine(bankScale, [onBasicCircle(100), onShortCircle(100)]);
drawLine(bankScale, [onBasicCircle(110), onShortCircle(110)]);
drawLine(bankScale, [onBasicCircle(120), onLongCircle(120)]);
drawLine(bankScale, [onBasicCircle(135), onShortCircle(135)]);
drawLine(bankScale, [onBasicCircle(150), onShortCircle(150)]);

drawLine(bankScale, [onBasicCircle(80), onShortCircle(80)]);
drawLine(bankScale, [onBasicCircle(70), onShortCircle(70)]);
drawLine(bankScale, [onBasicCircle(60), onLongCircle(60)]);
drawLine(bankScale, [onBasicCircle(45), onShortCircle(45)]);
drawLine(bankScale, [onBasicCircle(30), onShortCircle(30)]);

bankPointer.fillStyle = "#fb1"
bankPointer.lineWidth = LINE_WIDTH;
bankPointer.strokeStyle = "white";

drawLine(bankPointer, [[200,3], [185,23], [215,23]], true, false);

// 中心の飛行機のシンボルを描画する
symbol.fillStyle = "#110";
symbol.lineWidth = LINE_WIDTH + 2; // 塗りつぶしの色が違うので太さが小さくなる
symbol.strokeStyle = "white";
drawLine(symbol, [[194,209], [206,209], [206,221], [194,221]], true, true);
drawLine(symbol, [[33,210], [133,210], [133,250], [123,250], [123,220], [33,220]], true, true);
drawLine(symbol, [[367,210], [267,210], [267,250], [277,250], [277,220], [367,220]], true, true);

speedScale.fillStyle = "white";
speedScale.lineWidth = LINE_WIDTH;
speedScale.strokeStyle = "white";
for(let i=0;i<12;i++) {
	const linePositionY = 550 - (600/12*i);
	drawLine(speedScale, [[72, linePositionY], [90, linePositionY]]);
}

altitudeScale.fillStyle = "white";
altitudeScale.lineWidth = LINE_WIDTH;
altitudeScale.strokeStyle = "white";
for(let i=0;i<8;i++) {
	const linePositionY = 600 * (i/8);
	drawLine(altitudeScale, [[0, linePositionY], [18, linePositionY]]);
}

headingScale.fillStyle = "white";
headingScale.lineWidth = LINE_WIDTH;
headingScale.strokeStyle = "white";

for(let i=0;i<72;i++) { // 目盛りを描く
	const lineStartPosition = onCircle([300,300], 300, i*5);
	const lineEndPosition = onCircle([300,300], i%2===0 ? 280 : 290, i*5);
	drawLine(headingScale, [lineStartPosition, lineEndPosition]);
}

document.fonts.ready.then(() => {// 目盛りの数字を描く 書く場所のサイズを半分にし、位置を右下に置き、そこから回転しながら描画することで、回転しても数字が回転せずに描画する
	headingScale.translate(300, 300);
	headingScale.scale(.5, .5);
	for(let i=0;i<36;i++) {
		if(i % 3 === 0) { // 3の倍数のときは数字を大きくする
			headingScale.font = "bold 50px \"numFont\""; // サイズを半分にしているので、実際のフォントサイズは25pxになる
			headingScale.fillText(i, i<10 ? -12 : -25, -510); // i<10 ?...ってやつは2桁だと中心の位置がずれるから場合分けしてる
		} else {
			headingScale.font = "bold 35px \"numFont\""; // サイズを半分にしているので、実際のフォントサイズは17.5pxになる
			headingScale.fillText(i, i<10 ? -8 : -17, -520);
		}
		headingScale.rotate(Math.PI/18); // 30°回転する
	}
});

// 方位のやつの三角形
headingPointer.lineWidth = LINE_WIDTH;
headingPointer.strokeStyle = "white";
drawLine(headingPointer, [[285,25], [315,25], [300,47]], true, false);

// ここからセンサーの値を取得するプログラム
let altitude, speed, heading; // GPS
let beforeSpeed, beforeAltitude; // 前のティックのを保存する用
let accY; // headingの補完用の加速度
let alpha, beta, gamma; // 角度
let radian = {alpha, beta, gamma};
let updateID; // 更新のID
let error = { // デバイスから取得したデータの誤差
	accSum: 0,
	accY: 0,
	alpha: 0,
	beta: 0,
	gamma: 0
};
let doUpdateError = { // 誤差を更新するかどうか
	accSum: false,
	accY: false,
	alpha: false,
	beta: false,
	gamma: false
};
let lastTime = performance.now(); // 加速度の更新時間

function startSensors() {
	el("startSensors").style.display = "none"; // ボタンを消す
	if(updateID) navigator.geolocation.clearWatch(updateID); // すでに位置情報の更新を取得しているときはそれを止める
	// iPhoneの位置情報の許可を取る
	if(typeof DeviceOrientationEvent.requestPermission === "function") { // iPhone用の許可するための関数が存在するか
		DeviceOrientationEvent.requestPermission().then(response => {
			if(response === "granted") defineSensors();
		});
	} else defineSensors();
}

function defineSensors() {
	updateID = navigator.geolocation.watchPosition((pos)=>{ // GPSの定義
		const coords = pos.coords;
		altitude = coords.altitude;
		speed = coords.speed;
		heading = coords.heading;
	}, null, {
		enableHighAccuracy: false, // 高精度な位置情報を取得する
		maximumAge: 1000,
		timeout: 2000
	});

	if(updateID == 1) { // 最初だけ定義をする
		window.addEventListener("deviceorientation",(e)=>{ // 角度の定義
			if(e.webkitCompassHeading) { // iPhoneの方位角はalphaではなくwebkitCompassHeadingに入っているので、そっちがあるときはそっちをheadingに入れる
				alpha = e.webkitCompassHeading - error.alpha;
			} else {
				alpha = e.alpha - error.alpha;
			}
			
			if(settings.reverseBetaGamma.value) {
				beta = e.beta + error.gamma;
				gamma = e.gamma + error.beta;
			} else {
				beta = e.beta - error.beta;
				gamma = e.gamma - error.gamma;
			}

			if(settings.reverseBetaGamma.value) {
				const beforeBeta = beta;
				beta = gamma;
				gamma = beforeBeta;
				if(beta >= 0) {
					beta = 90 - beta;
					gamma = (180-Math.abs(gamma)) * Math.sign(gamma);
				} else {
					beta += 90;
					beta *= -1;
				};
				beta += 90;
				// gamma = (180-Math.abs(gamma)) * Math.sign(gamma);
				// beta = 90 + ((beta-90) * -1);
			}

			if(doUpdateError.alpha) { // 誤差の更新を申請されたときの処理
				error.alpha = (alpha + error.alpha) % 360;
				alpha = 0;
				doUpdateError.alpha = false;
				document.querySelector("#headingOffset > .rewritableDisplay").value = error.alpha.toFixed(3);
			}
			if(doUpdateError.beta) { // 同上
				if(beta + error.beta > 180 || beta + error.beta < -180) {
							error.beta = (beta + error.beta + 180) % 360 - 180;
				} else {
						error.beta = (beta + error.beta) - 90;
				}
				beta = 0;
				doUpdateError.beta = false;
				document.querySelector("#betaOffset > .rewritableDisplay").value = error.beta.toFixed(3);
			}
			if(doUpdateError.gamma) { // 同上
				if(gamma + error.gamma > 90 || gamma + error.gamma < -90) {
						error.gamma = (gamma + error.gamma + 90) % 180 - 90;
				} else {
							error.gamma = gamma + error.gamma;
				}
				gamma = 0;
				doUpdateError.gamma = false;
				document.querySelector("#gammaOffset > .rewritableDisplay").value = error.gamma.toFixed(3);
			}

			radian.alpha = alpha * Math.PI / 180;
			radian.beta = beta * Math.PI / 180;
			radian.gamma = gamma * Math.PI / 180;
		});

		window.addEventListener("devicemotion",(e)=>{ // 加速度の定義　GPSによって速度を取得する間を補完するためのもの
			const acc = e.acceleration;
			if(acc && el("speedUseDeviceMotion").checked) { // 加速度が取得できたときのみ実行
				const accX = acc.x;
				let accY = acc.y; // 一応変更される可能性がある
				const accZ = acc.z;
				const accAdded = (accX**2 * Math.sign(accX)) + (accY**2 * Math.sign(accY)) + (accZ**2 * Math.sign(accZ));
				let accSum = Math.sqrt(Math.abs(accAdded)) * Math.sign(accAdded); // accYと同じように変更される可能性がある

				const now = performance.now();
				const dt = (now - lastTime) / 1000; // 前回の更新からの時間(秒)

				if(doUpdateError.accSum) { // 角度のやつと同じ
					error.accSum = accSum;
					accSum = 0;
					doUpdateError.accSum = false;
					document.querySelector("#speedDeviceMotionOffset > .rewritableDisplay").value = accError.toFixed(3);
				}
				if(doUpdateError.accY) { // 同上
					error.accY = accY;
					accY = 0;
					doUpdateError.accY = false;
					document.querySelector("#headingDeviceMotionOffset > .rewritableDisplay").value = accError.toFixed(3);
				}

				speed += (accSum - error.accSum) * dt; // 加速度から速度を求める 誤差を引いてdtをかけることで、前回の更新からの速度の変化量を求めて、それを今の速度に足す
				accY += (accY - error.accY) * dt; // 加速度から速度を求める 誤差を引いてdtをかけることで、前回の更新からの速度の変化量を求めて、それを今の速度に足す
				lastTime = now;
			}
		});
	};
	update(); // 表示を更新し続けるトリガー
};

function update() {
	el("outputAlpha").innerHTML = alpha ? alpha : 0;
	el("outputBeta").innerHTML = beta ? beta : 0;
	el("outputGamma").innerHTML = gamma ? gamma : 0;
	el("outputAltitude").innerHTML = altitude ? altitude : 0;
	el("outputSpeed").innerHTML = speed ? speed : 0;
	el("outputHeading").innerHTML = heading ? heading : 0;

	el("headingScale").style.rotate = (-alpha || 0) + "deg"; // 方位を更新

	const absBeta = Math.abs(beta) || 0;
	if(Math.sign(beta-90) === -1) {
		el("ground").style.translate = "-50% " + (absBeta < 67 ? -180 : (absBeta - 90) * 8) + "px";
	} else {
		el("ground").style.translate = "-50% " + (absBeta > 113 ? 180 : (absBeta - 90) * 8) + "px";
	} // 地面の角度を更新　90°からの差が23°以上のときは位置を固定
	el("highScale").style.translate = "0 " + (absBeta > 180 ? 0 : (absBeta - 90) * 8) + "px"; // 上下の角度を更新　90°以上のときは動かないようにしている

	// 傾きの角度を更新　常に真上を向くようにしたいので、傾ける角度は-gamma
	el("ground").style.rotate = (-gamma || 0) + "deg";
	el("highScale").style.rotate = (-gamma || 0) + "deg";
	el("bankPointer").style.rotate = (-gamma || 0) + "deg";
	bankPointer.clearRect(0,0, 400,225);
	if(Math.abs(gamma) >= 35) { // 角度にって色が変わるので、その処理
		bankPointer.strokeStyle = "#fb1";
		drawLine(bankPointer, [[200,3], [185,23], [215,23]], true, true);
	} else {
		bankPointer.strokeStyle = "white";
		drawLine(bankPointer, [[200,3], [185,23], [215,23]], true, false);
	}

	// ここから速度の更新
	const baseSpeed = speed;
	switch(settings.speedUnitType.value) { // メートル毎秒から他の単位へ変換
		case "kn":
			speed *= 1.94384;
			beforeSpeed *= 1.94384;
			break;
		case "km/h":
			speed *= 3.6;
			beforeSpeed *= 3.6;
			break;
		case "m/s":
			break;
		case "MPH":
			speed *= 2.23694;
			beforeSpeed *= 2.23694
			break;
	}
	const NUM_SPACE = " "; // 数字と同じ大きさの空白
	const speedDecimal = speed % 1;
	const filledSpeed = Math.floor(speed).toString().padStart(3, NUM_SPACE);
	const speedOncePlace = Number(filledSpeed.slice(-1)); // 1の位
	const speedOncePlaceRounded = (speedOncePlace + Math.round(speedDecimal)) % 10;
	if(speed > beforeSpeed && speed%10 < beforeSpeed%10) { // スピードの1の位が繰り上がったら
		el("speedOtherPlaces").style.animation = "none";
		void el("speedOtherPlaces").offsetWidth; // 一回初期化
		el("speedOtherPlaces").style.animation = "numCarryUp .1s ease-out forwards";
		setTimeout(() => {
			el("speedOtherPlaces").innerHTML = filledSpeed.slice(0,-1);
		}, 50);
	} else if(speed < beforeSpeed && speed%10 > beforeSpeed%10) { // スピードの10の位が繰り下がったら
		el("speedOtherPlaces").style.animation = "none";
		void el("speedOtherPlaces").offsetWidth; // 一回初期化
		el("speedOtherPlaces").style.animation = "numCarryDown .1s ease-out forwards";
		setTimeout(() => {
			el("speedOtherPlaces").innerHTML = filledSpeed.slice(0,-1);
		}, 50);
	} else {
		el("speedOtherPlaces").innerHTML = filledSpeed.slice(0,-1);
	}
	el("speedOncePlaceTop").innerHTML = speedOncePlaceRounded === 9 ? 0 : speedOncePlaceRounded + 1;
	el("speedOncePlaceMiddle").innerHTML = speedOncePlaceRounded;
	el("speedOncePlaceBottom").innerHTML = speedOncePlaceRounded === 0 ? 9 : speedOncePlaceRounded - 1;
	if(Math.round(speedDecimal) === 0) {
		el("speedOncePlace").style.translate = `0 calc(${speedDecimal}em - ${speedDecimal * 20}%)`;
	} else {
		el("speedOncePlace").style.translate = `0 calc(${speedDecimal-1}em - ${(speedDecimal-1) * 20}%)`;
	};
	const speedDivisionSize = settings.speedDivisionSize.value;
	el("speedScale").style.translate = `0 ${speed%speedDivisionSize/speedDivisionSize * 50}px`;
	speed = baseSpeed;
	beforeSpeed = speed;
	
	// ここから高度の更新
	const baseAltitude = altitude;
	switch(settings.altitudeUnitType.value) { // メートルから他の単位へ変換
		case "ft":
			altitude *= 3.28084;
			beforeAltitude *= 3.28084;
			break;
		case "m":
			break;
		case "km":
			altitude /= 1000;
			beforeAltitude /= 1000;
			break;
	}
	const divisionSize = settings.altitudeDivisionSize.value;
	const altitudeDecimal = altitude % 1;
	const filledAltitude = Math.floor(altitude).toString().padStart(5, NUM_SPACE);
	const altitudeUnderOncePlace = Number(filledAltitude.slice(-1)) + altitudeDecimal; // 1以下の位
	const altitudeTwoPlaces = Number(filledAltitude.slice(-2)); // 1~10の位
	const altitudeTwoPlacesRounded = Math.trunc((altitudeTwoPlaces + Math.round(divisionSize==1 ? altitudeDecimal : altitudeUnderOncePlace)) % 100 / divisionSize) * divisionSize;
	if(altitude > beforeAltitude && altitude%100 < beforeAltitude%100) { // 高度の10の位が繰り上がったら
		el("altitudeOtherPlaces").style.animation = "none";
		void el("altitudeOtherPlaces").offsetWidth; // 一回初期化
		el("altitudeOtherPlaces").style.animation = "numCarryUp .1s ease-out forwards";
		setTimeout(() => {
			el("altitudeOtherPlaces").innerHTML = filledAltitude.slice(0,-2);
		}, 50);
	} else if(altitude < beforeAltitude && altitude%100 > beforeAltitude%100) { // 高度の100の位が繰り下がったら
		el("altitudeOtherPlaces").style.animation = "none";
		void el("altitudeOtherPlaces").offsetWidth; // 一回初期化
		el("altitudeOtherPlaces").style.animation = "numCarryDown .1s ease-out forwards";
		setTimeout(() => {
			el("altitudeOtherPlaces").innerHTML = filledAltitude.slice(0,-2);
		}, 50);
	} else {
		el("altitudeOtherPlaces").innerHTML = altitude < 100 ? "0".padStart(3, NUM_SPACE) : filledAltitude.slice(0,-2);
	}
	if(divisionSize == 1) {
		el("altitudeOncePlaceTop").innerHTML = altitudeTwoPlacesRounded === 9 ? "00" : (altitudeTwoPlacesRounded + divisionSize).toString().padStart(2, "0");
		el("altitudeOncePlaceBottom").innerHTML = altitudeTwoPlacesRounded === 0 ? 99 : (altitudeTwoPlacesRounded - divisionSize).toString().padStart(2, "0");
	} else {
		el("altitudeOncePlaceTop").innerHTML = altitudeTwoPlacesRounded === 90 ? "00" : (altitudeTwoPlacesRounded + divisionSize).toString().padStart(2, "0");
		el("altitudeOncePlaceBottom").innerHTML = altitudeTwoPlacesRounded === 0 ? 90 : (altitudeTwoPlacesRounded - divisionSize).toString().padStart(2, "0");
	}
	el("altitudeOncePlaceMiddle").innerHTML = altitudeTwoPlacesRounded.toString().padStart(2, "0");
	if(divisionSize == 1) {
		if(Math.round(altitudeDecimal) === 0) {
			el("altitudeTwoPlaces").style.translate = `0 calc(${altitudeDecimal}em - ${altitudeDecimal * 20}%)`;
		} else {
			el("altitudeTwoPlaces").style.translate = `0 calc(${altitudeDecimal-1}em - ${(altitudeDecimal-1) * 20}%)`;
		}
	} else if(Math.round(altitudeUnderOncePlace/divisionSize) === 0) {
		el("altitudeTwoPlaces").style.translate = `0 calc(${altitudeUnderOncePlace/divisionSize}em - ${altitudeUnderOncePlace * 2}%)`;
	} else {
		el("altitudeTwoPlaces").style.translate = `0 calc(${altitudeUnderOncePlace/divisionSize-1}em - ${(altitudeUnderOncePlace/divisionSize-1) * 20}%)`;
	}
	const altitudeDivisionSize = settings.altitudeScaleDivisionSize.value;
	el("altitudeScale").style.translate = `0 ${altitude%altitudeDivisionSize/altitudeDivisionSize * 75}px`;
	altitude = baseAltitude;
	beforeAltitude = altitude;

	requestAnimationFrame(update);
}

// ここから設定に関するプログラム
let isSettingsOpen = true; // 設定が開いているかどうか
let settings = {};
const allSettings = document.querySelectorAll(".settings");
window.onload = setSettings;

/**
 * 設定の各要素の位置を指定します。
 * 設定の要素の位置の指定には、data-{top|bottom|left|right}属性(以下、data-*と呼びます)を使用します。
 * data-*属性の値には、要素の横幅や高さに対する距離を指定します(position;absolute時の値と同じです)。ただし、末尾に"+"か"-"がついていたら、要素の横幅や高さをそれぞれプラスとマイナスに追加します。
*/
function setSettings() {
		// スピンボタン(数字を表示する場所と、数値を変更するプラス、マイナスのボタン)
	document.querySelectorAll(".valueWithSpinBt").forEach(element => {
		const dataset = element.dataset;
		let data = settings[element.id] = {};
		data.possibleValues = dataset.possibleValues.split(",").map(Number);
		data.value = Number(dataset.value);
		const max = data.possibleValues[data.possibleValues.length - 1];
		// まずは要素を作る
		const display = document.createElement("span");
		const minusBt = document.createElement("button");
		const plusBt = document.createElement("button");
		// 要素を設定する
		display.textContent = data.value.toString().padStart(max.toString().length, "!");
		display.classList.add("display");
		plusBt.textContent = "+";
		plusBt.classList.add("plusBt");
		if(data.value === max) {
			plusBt.disabled = true;
			plusBt.style.setProperty("--label", '\"MAX\"');
		} else {
			plusBt.disabled = false;
			plusBt.style.setProperty("--label", `\"${data.possibleValues[data.possibleValues.indexOf(data.value) + 1]}\"`);
		}
		minusBt.textContent = "−";
		minusBt.classList.add("minusBt");
		if(data.value === data.possibleValues[0]) {
			minusBt.disabled = true;
			minusBt.style.setProperty("--label", '\"MIN\"');
		} else {
			minusBt.disabled = false;
			minusBt.style.setProperty("--label", `\"${data.possibleValues[data.possibleValues.indexOf(data.value) - 1]}\"`);
		}
		// 要素を配置する
		element.appendChild(minusBt);
		element.appendChild(display);
		element.appendChild(plusBt);

		// クリック時の処理を定義
		plusBt.addEventListener("click", () => {
			const beforeValue = data.value;
			const newValue = data.possibleValues[data.possibleValues.indexOf(data.value) + 1];
			data.value = newValue;
			display.textContent = data.value.toString().padStart(max.toString().length, "!");
			const nextValue = data.possibleValues[data.possibleValues.indexOf(data.value) + 1];
			if(data.value === max) {
				plusBt.disabled = true;
				plusBt.style.setProperty("--label", '\"MAX\"');
			} else {
				plusBt.disabled = false;
				plusBt.style.setProperty("--label", `\"${nextValue}\"`);
			}
			minusBt.disabled = false;
			minusBt.style.setProperty("--label", `\"${beforeValue}\"`);
		});
		minusBt.addEventListener("click", () => {
			const beforeValue = data.value;
			const newValue = data.possibleValues[data.possibleValues.indexOf(data.value) - 1]
			data.value = newValue;
			display.textContent = data.value.toString().padStart(max.toString().length, "!");
			const nextValue = data.possibleValues[data.possibleValues.indexOf(data.value) - 1]
			if(data.value === data.possibleValues[0]) {
				minusBt.disabled = true;
				minusBt.style.setProperty("--label", '\"MIN\"');
			} else {
				minusBt.disabled = false;
				minusBt.style.setProperty("--label", `\"${nextValue}\"`);
			}
			plusBt.disabled = false;
			plusBt.style.setProperty("--label", `\"${beforeValue}\"`);
		});
	});

	document.querySelectorAll(".valueWithLRBt").forEach(element => {
		const dataset = element.dataset;
		let data = settings[element.id] = {};
		data.possibleValues = dataset.possibleValues.split(",");
		data.value = dataset.value;
		const longestLength = data.possibleValues.reduce((a, b) => a.length > b.length ? a : b).length;
		const lastValue = data.possibleValues[data.possibleValues.length - 1];
		// まずは要素を作る
		const display = document.createElement("span");
		const leftBt = document.createElement("button");
		const rightBt = document.createElement("button");
		// 要素を設定する
		display.textContent = data.value.toString().padStart(longestLength, " ");
		display.classList.add("display");
		leftBt.textContent = "←";
		leftBt.classList.add("leftBt");
		if(data.value === data.possibleValues[0]) {
			leftBt.disabled = true;
			leftBt.style.setProperty("--label", '\"1ST\"');
		} else {
			leftBt.disabled = false;
			leftBt.style.setProperty("--label", `\"${data.possibleValues[data.possibleValues.indexOf(data.value) - 1]}\"`);
		}
		rightBt.textContent = "→";
		rightBt.classList.add("rightBt");
		if(data.value === lastValue) {
			rightBt.disabled = true;
			rightBt.style.setProperty("--label", '\"LAST\"');
		} else {
			rightBt.disabled = false;
			rightBt.style.setProperty("--label", `\"${data.possibleValues[data.possibleValues.indexOf(data.value) + 1]}\"`);
		}
		// 要素を配置する
		element.appendChild(leftBt);
		element.appendChild(display);
		element.appendChild(rightBt);

		// クリック時の処理を定義
		leftBt.addEventListener("click", () => {
			const beforeValue = data.value;
			const newValue = data.possibleValues[data.possibleValues.indexOf(data.value) - 1]
			data.value = newValue;
			display.textContent = data.value.toString().padStart(longestLength, " ");
			const nextValue = data.possibleValues[data.possibleValues.indexOf(data.value) - 1]
			if(data.value === data.possibleValues[0]) {
				leftBt.disabled = true;
				leftBt.style.setProperty("--label", '\"1ST\"');
			} else {
				leftBt.disabled = false;
				leftBt.style.setProperty("--label", `\"${nextValue}\"`);
			}
			rightBt.disabled = false;
			rightBt.style.setProperty("--label", `\"${beforeValue}\"`);
		});
		rightBt.addEventListener("click", () => {
			const beforeValue = data.value;
			const newValue = data.possibleValues[data.possibleValues.indexOf(data.value) + 1];
			data.value = newValue;
			display.textContent = data.value.toString().padStart(longestLength, " ");
			const nextValue = data.possibleValues[data.possibleValues.indexOf(data.value) + 1];
			if(data.value === lastValue) {
				rightBt.disabled = true;
				rightBt.style.setProperty("--label", '\"LST\"');
			} else {
				rightBt.disabled = false;
				rightBt.style.setProperty("--label", `\"${nextValue}\"`);
			}
			leftBt.disabled = false;
			leftBt.style.setProperty("--label", `\"${beforeValue}\"`);
		});
	});

	document.querySelectorAll(".toggleBt").forEach(element => {
		let data = settings[element.id] = {};
		data.value = element.checked;

		// クリック時の処理を定義
		element.addEventListener("click", () => {
			data.value = !data.value;
		});
	});

	function updateWritableVal(id) {
		const display = document.querySelector(`#${id} .rewritableDisplay`);
		switch(id) {
			case "speedDeviceMotionOffset":
				error.accSum = Number(display.value);
				break;
			case "betaOffset":
				error.beta = Number(display.value);
				break;
			case "gammaOffset":
				error.gamma = Number(display.value);
				break;
			case "altitudeDeviceMotionOffset":
				error.accY = Number(display.value);
				break;
			case "headingOffset":
				error.alpha = Number(display.value);
				break;
			default:
				console("updateWritableVal error"); // 一応のエラー出力
				break;
		}
		const stepLog10 = Math.log10(el(id).dataset.step);
		let [integerPart, decimalPart] = display.value.split(".");
		if(decimalPart && decimalPart.length !== -stepLog10) {
			decimalPart = decimalPart.padEnd(-stepLog10, "0");
			decimalPart = decimalPart.slice(0, (-stepLog10));
		} else if(!decimalPart && stepLog10 < 0) {
			decimalPart = "0".repeat(-stepLog10);
		};
		const result = (integerPart + "." + decimalPart);
		display.value = result;
	}

	document.querySelectorAll(".rewritableVal").forEach(element => {
		const dataset = element.dataset;
		let data = settings[element.id] = {};
		data.initialVal = dataset.value;
		const decimalPart = data.initialVal.split(".")[1];
		const display = document.createElement("input");
		const resetBt = document.createElement("button");
		const setNowBt = document.createElement("button");

		// 要素を設定する
		display.value = data.initialVal;
		display.type = "number";
		display.step = dataset.step;
		display.classList.add("rewritableDisplay");
		resetBt.textContent = "RESET";
		resetBt.classList.add("resetBt");
		setNowBt.textContent = "SET TO NOW";
		setNowBt.classList.add("setNowBt");

		// 要素を配置する
		element.appendChild(display);
		element.appendChild(resetBt);
		element.appendChild(setNowBt);

		updateWritableVal(element.id);

		// クリック時の処理を定義
		resetBt.addEventListener("click", () => {
			display.value = data.initialVal;
			updateWritableVal(element.id);
		});
		setNowBt.addEventListener("click", () => {
			switch(element.id) {
				case "speedDeviceMotionOffset":
					doUpdateError.accSum = true;
					break;
				case "betaOffset":
					doUpdateError.beta = true;
					break;
				case "gammaOffset":
					doUpdateError.gamma = true;
					break;
				case "altitudeDeviceMotionOffset":
					doUpdateError.accY = true;
					break;
				case "headingOffset":
					doUpdateError.alpha = true;
					break;
				default:
					console("setNowBt error"); // 一応のエラー出力
					break;
			}
		});
		display.addEventListener("change", () => {
			updateWritableVal(element.id);
		});
	});

	allSettings.forEach(element => {
		const parent = element.parentElement;
		const dataset = element.dataset;
		let top = dataset.top;
		let bottom = dataset.bottom;
		let left = dataset.left;
		let right = dataset.right;
		let data = {
			pos: [
				{direction: null, value: null},
				{direction: null, value: null}
			], // 要素が設定元の要素からどれだけ離れているか
			isProtrude: null, // 要素が設定元の要素から完全にはみ出しているか
		}

		// data-*の値から設定元の要素からの位置を指定する
		if(left) {
			if(left.slice(-1) === "+" || left.slice(-1) === "-") { // もし最後に+か-がついていたら要素の横幅分をプラスかマイナスに追加する
				const valPart = Number(left.slice(0, -1));
				left = valPart + element.offsetWidth * (left.slice(-1) === "+" ? 1 : -1);
			}
			element.style.left = left + "px";
			data.pos[0].direction = "left";
			data.pos[0].value = left;
		} else {
			if(right.slice(-1) === "+" || right.slice(-1) === "-") { // 同上
				const valPart = Number(right.slice(0, -1));
				right = valPart + element.offsetWidth * (right.slice(-1) === "+" ? 1 : -1);
			}
			element.style.right = right + "px";
			data.pos[0].direction = "right";
			data.pos[0].value = right;
		}
		if(top) {
			if(top.slice(-1) === "+" || top.slice(-1) === "-") { // 上のやつの縦バージョン
				const valPart = Number(top.slice(0, -1));
				top = valPart + element.offsetHeight * (top.slice(-1) === "+" ? 1 : -1);
			}
			element.style.top = top + "px";
			data.pos[1].direction = "top";
			data.pos[1].value = top;
		} else {
			if(bottom.slice(-1) === "+" || bottom.slice(-1) === "-") { // 同上
				const valPart = Number(bottom.slice(0, -1));
				bottom = valPart + element.offsetHeight * (bottom.slice(-1) === "+" ? 1 : -1);
			}
			element.style.bottom = bottom + "px";
			data.pos[1].direction = "bottom";
			data.pos[1].value = bottom;
		}

		if(data.pos[0].value < -element.offsetWidth || data.pos[1].value < -element.offsetHeight) { // 位置の指定にマイナスが使われており、その絶対値がこの要素の幅や高さより大きいときは、その要素は設定元の要素から完全にはみ出している
			data.isProtrude = true;
		} else if(data.pos[0].value > parent.offsetWidth || data.pos[1].value > parent.offsetHeight) { // 位置の指定が設定元の要素の幅や高さより大きいなら、その要素は設定元の要素から完全にはみ出している
			data.isProtrude = true;
		} else {
			data.isProtrude = false;
		};
		// 値が大きすぎててはみ出しているのをマイナスに指定したせいではみ出していることに変換する 図で考えてみると分かりやすいかも
		if(data.pos[0].value > parent.offsetWidth) {
			data.pos[0].direction = data.pos[0].direction === "left" ? "right" : "left"; // 方向を逆にする
			data.pos[0].value -= parent.offsetWidth; // これは正の値になる
			data.pos[0].value += element.offsetWidth;
			data.pos[0].value *= -1; // マイナスにする
		}
		if(data.pos[1].value > parent.offsetHeight) { // 上のプログラムのy軸版
			data.pos[1].direction = data.pos[1].direction === "top" ? "bottom" : "top";
			data.pos[1].value -= parent.offsetHeight;
			data.pos[1].value += element.offsetHeight;
			data.pos[1].value *= -1;
		}

		if(data.isProtrude) { // 要素が設定元の要素からはみ出しているときに線を引く
			const line = document.createElement("div");
			line.classList.add("settingsLine");
			if(data.pos[0].value < -element.offsetWidth && data.pos[1].value < -element.offsetHeight) { // 要素が設定元の要素から左右にも上下にもはみ出しているときは、要素の左右から出て設定元の上下に付くような線を引く
				line.style.width = (-data.pos[0].value - element.offsetWidth + 15) + "px"; // 線が設定元に付くときの余白を15pxにするために15を足す
				line.style.height = (-data.pos[1].value - element.offsetHeight + 15) + "px"; // 線が要素に付くときの余白を作るために、上側にマイナスなら要素から線の上側の余白である15pxを引いた分を、下側にマイナスなら15pxを足す
				line.style[data.pos[0].direction] = "100%";
				line.style[data.pos[1].direction] = "calc(100% - 15px)";
				line.style[data.pos[0].direction === "left" ? "borderRightWidth" : "borderLeftWidth"] = "2px"; // どちら側にマイナスになっているかによって線を引くこの要素のどちら側に線を作るかが変わるため、それを処理するプログラム
				line.style[data.pos[1].direction === "top" ? "borderTopWidth" : "borderBottomWidth"] = "2px";
			} else if(data.pos[0].value < -element.offsetWidth) { // 要素が設定元の要素から左か右にはみ出しているときは、線を水平にする
				line.style.width = (-data.pos[0].value - element.offsetWidth) + "px";
				line.style.height = "0";
				line.style[data.pos[1].direction] = "15px";
				line.style[data.pos[0].direction] = "100%";
				line.style.borderTopWidth = "2px";
			} else { // 要素が設定元の要素から上か下にはみ出しているときは、線を垂直にする
				line.style.height = (-data.pos[1].value - element.offsetHeight) + "px";
				line.style.width = "0";
				line.style[data.pos[0].direction] = "15px";
				line.style[data.pos[1].direction] = "100%";
				line.style.borderLeftWidth = "2px";
			}
			element.appendChild(line);
		}
	});
};

function settingsDisplay() {
	allSettings.forEach(element => {
		if(isSettingsOpen) {
			element.style.display = "none";
		} else {
			element.style.display = "grid";
		};
	});
	if(isSettingsOpen) {
		el("enableCamera").style.display = "none";
	} else {
		el("enableCamera").style.display = "block";
	}
	isSettingsOpen = !isSettingsOpen;
}

function enableCamera() {
	if(isSettingsOpen) settingsDisplay(); // 設定を全て非表示にする
	navigator.mediaDevices.getUserMedia({ video: {
		aspectRatio: 4 / 3,
    facingMode: { ideal: "environment" }
	} })
  .then(stream => {
    el("camera").srcObject = stream;
		el("camera").style.display = "block";
		el("camera").style.animation = "fadeIn 1s 1s linear forwards";
		el("enableCamera").style.opacity = 0; // opacityはここ以外で操作しないので永久に表示しない
		el("speedMeter").style.animation = "speedMeterMove 1s ease-in-out forwards"; // スピードメーターを動かす
		el("altitudeMeter").style.animation = "altitudeMeterMove 1s ease-in-out forwards"; // アルティメーターを動かす
		el("center").classList.add("camera");
		el("ground").classList.add("camera");
		el("high").classList.add("camera");
		el("speedMeter").classList.add("camera");
		el("altitudeMeter").classList.add("camera");
  })
  .catch(err => {
    console.error("カメラ取得エラー:", err);
  });
}