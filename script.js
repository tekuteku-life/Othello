// Copyright (C) 2010 kt9, All rights reserved.
//--------グローバル変数の定義----------
var mouseX = 0;									// マウスの横方向座標
var mouseY = 0;									// マウスの縦方向座標
var mouseBlockX = ~~(mouseX / blockSize);		// マウスのマス上での横方向座標
var mouseBlockY = ~~(mouseY / blockSize);		// マウスのマス上での縦方向座標

var blockSize = 60;								// １マスのサイズ
var canvasSize = blockSize * 8;					// ボードのサイズ
var numSize = 25;								// ボード横の番号幅
var msgSize = 90;								// メッセージサイズ

var gameEndFlag = 0;							// ゲーム進行フラグ
var turn = 1;									// ターン
var turn_bp = 1;								// アンドゥ用ターン

var boad = new Array();							// ボード配列
var boad_bp = new Array();						// アンドゥ用ボード配列
var blackStoneNum = 0;							// 黒石の数
var whiteStoneNum = 0;							// 白石の数
//--------グローバル変数の定義----------



//----------------------------------------
// 初期化
//----------------------------------------
function init()
{
	// 描画先canvasのidを取得する
	canvas = document.getElementById('canvas');
	if( !canvas || !canvas.getContext ) { return flase; }

	// contextを取得する
	ctx = canvas.getContext('2d');

	// キャンバスの大きさを取得する
	canvas.width = canvasSize + numSize;
	canvas.height = canvasSize + numSize;

	// マウスの動作設定
	canvas.onmousemove = function(event) {
		if( gameEndFlag == 0 ) {
			moveMouse(event);
			draw(ctx, canvas);
		}
	}
	canvas.onclick = function() {
		if( gameEndFlag == 0 ) {
			putStone();
			draw(ctx, canvas);
		} else {
			init();
		}
	}

	// アンドゥ
	document.getElementById('undo').onclick = function() {
		if( boad_bp.length > 0 ) {
			// ボードの復元
			boad = boad_bp.copy();
			boad_bp = new Array();

			// ターンの復元
			turn = turn_bp;
			turn_bp = 1;

			// 描画
			draw(ctx, canvas);
		}
	}

	// 順番の初期化
	turn = 1;

	// ゲーム開始
	gameEndFlag = 0;

	// ボードの初期化
	for( var i = 0; i < 8; i++ ) {
		boad[i] = new Array();

		for( var j = 0; j < 8; j++ ) { boad[i][j] = 0; }
	}
	boad[3][3] = boad[4][4] = 1;
	boad[3][4] = boad[4][3] = -1;

	// 初期描画
	draw(ctx, canvas);
}



//----------------------------------------
// ゲーム終了
//----------------------------------------
function gameOver() {
	// ゲームを終了する
	gameEndFlag = 1;

	// 石数の計算
	blackStoneNum = 0;
	whiteStoneNum = 0;
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			if( boad[x][y] == 1 ) { blackStoneNum++; }
			else if( boad[x][y] == -1 ) { whiteStoneNum++; }
		}
	}
}



//----------------------------------------
// 石を返す
//----------------------------------------
function turnStone(x, y, i, j, mode)
{
	if( i == 0 && j == 0 ) { return 0; }

	x += i;
	y += j;

	// 例外処理
	if( x < 0 || x > 7 || y < 0 || y > 7 ) { return 0; }

	// 何もないとき
	if( boad[x][y] == 0 ) {
		return 0;

	// 自分の石があるとき
	} else if( boad[x][y] == turn ) {
		return 3;

	// 相手の石があるとき
	} else {
		// 最後に自分の石があればひっくり返す
		if( turnStone(x, y, i, j, mode) >= 2 ) {
			if( mode != 0 ) { boad[x][y] = turn; }
			return 2;
		}

		return 1;
	}
}



//----------------------------------------
// 石を置く
//----------------------------------------
function putStone()
{
	// 可否確認
	if( boad[mouseBlockX][mouseBlockY] != 0 ) { return; }

	// アンドゥ用にデータを退避
	boad_bp = boad.copy();
	turn_bp = turn;

	// 石を返す
	var turnCheck = 0;
	for( var i = -1; i <= 1; i++ ) {
		for( var j = -1; j <= 1; j++ ) {
			if( turnStone(mouseBlockX, mouseBlockY, i, j, 1) == 2 ) { turnCheck = 1; }
		}
	}
	// 石を置けるかの可否確認
	if( turnCheck == 0 ) { return; }

	// 石を置く
	boad[mouseBlockX][mouseBlockY] = turn;

	// 順番を入れ替える
	turn *= -1;

	//----------置けるかどうかの確認----------
	turnCheck = 0;
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			if( boad[x][y] == 0 ) {
				for( var i = -1; i <= 1; i++ ) {
					for( var j = -1; j <= 1; j++ ) {
						if( turnStone(x, y, i, j, 0) == 2 ) {
							turnCheck = 1;
							break;
						}
					}
					if( turnCheck != 0 ) { break; }
				}
				if( turnCheck != 0 ) { break; }
			}
		}
		if( turnCheck != 0 ) { break; }
	}

	// 置けないときは順番そのまま
	if( turnCheck == 0 ) {
		turn *= -1;

		// 置けるかどうかの確認
		var turnCheck = 0;
		for( var x = 0; x < 8; x++ ) {
			for( var y = 0; y < 8; y++ ) {
				if( boad[x][y] == 0 ) {
					for( var i = -1; i <= 1; i++ ) {
						for( var j = -1; j <= 1; j++ ) {
							if( turnStone(x, y, i, j, 0) == 2 ) {
								turnCheck = 1;
								break;
							}
						}
						if( turnCheck != 0 ) { break; }
					}
					if( turnCheck != 0 ) { break; }
				}
			}
			if( turnCheck != 0 ) { break; }
		}

		// 終了判定
		if( turnCheck == 0 ) {
			gameOver();
			return;
		}
	}
	//----------置けるかどうかの確認----------

	// ゲームの終了判定
	var gameCheck = 0;
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			if( boad[x][y] == 0 ) {
				gameCheck = 1;
				break;
			}
		}
		if( gameCheck != 0 ) { break; }
	}
	if( gameCheck == 0 ) {
		gameOver();
		return;
	}
}



//----------------------------------------
// マウスの移動
//----------------------------------------
function moveMouse(event)
{
	// マウス座標の取得
	if( event ) {
		mouseX = event.pageX - canvas.offsetLeft;
		mouseY = event.pageY - canvas.offsetTop;
	} else {
		mouseX = event.offsetX;
		mouseY = event.offsetY;
	}

	// 実座標
	mouseX = ~~(mouseX / canvas.offsetWidth * (canvasSize + numSize));
	mouseY = ~~(mouseY / canvas.offsetHeight * (canvasSize + numSize));

	// マス座標
	mouseBlockX = ~~((mouseX - numSize - 0.5) / blockSize);
	mouseBlockY = ~~((mouseY - numSize - 0.5) / blockSize);
}



//----------------------------------------
// すべての描画
//----------------------------------------
function draw(ctx, canvas)
{
	// マウス位置の取得
	var mouseBlockXr = mouseBlockX * blockSize + numSize;
	var mouseBlockYr = mouseBlockY * blockSize + numSize;

	// 描画の削除
	ctx.clearRect(0, 0, canvasSize + numSize, canvasSize + numSize);

	// 罫線の描画
	ctx.beginPath();
	ctx.globalAlpha = 1;
	ctx.strokeStyle = '#000000';
	for( var i = 0; i <= 7; i++ ) {
		ctx.moveTo( ~~(i * blockSize) + numSize + 0.5, 0.5);
		ctx.lineTo( ~~(i * blockSize) + numSize + 0.5, canvasSize + numSize + 0.5);

		ctx.moveTo(0.5,  ~~(i * blockSize) + numSize + 0.5);
		ctx.lineTo(canvasSize + numSize + 0.5, ~~(i * blockSize) + numSize + 0.5);
	}
	ctx.stroke();

	// 石の表示
	canvas.style.cursor = 'default';
	for( var x = 0; x < 8; x++ ) {
		for( var y = 0; y < 8; y++ ) {
			// 石がある場所
			if( boad[x][y] == 1 || boad[x][y] == -1 ) {
				ctx.beginPath();
				if( boad[x][y] == 1 ) { ctx.fillStyle = '#000000'; }
				else if( boad[x][y] == -1 ) { ctx.fillStyle = '#ffffff'; }
				ctx.strokeStyle = '#000000';
				ctx.arc(x * blockSize + ~~(blockSize * 0.5) + numSize + 0.5, y * blockSize + ~~(blockSize * 0.5) + numSize + 0.5, blockSize / 2 * 0.8, 0, 2 * Math.PI, false);
				ctx.fill();
				ctx.stroke();

			// 石がない場所（置けるかどうかの確認）
			} else if( boad[x][y] == 0 ) {
				var turnCheck = 0;
				for( var i = -1; i <= 1; i++ ) {
					for( var j = -1; j <= 1; j++ ) {
						if( turnStone(x, y, i, j, 0) == 2 ) {
							// 濃度調節
							var alpha = 0;
							if( x == mouseBlockX && y == mouseBlockY ) {
								canvas.style.cursor = 'pointer';
								alpha = 0.5;
							} else {
								alpha = 0.2;
							}

							// 石の表示
							ctx.beginPath();
							ctx.globalAlpha = alpha;
							if( turn == 1 ) { ctx.fillStyle = '#000000'; }
							else if( turn == -1 ) { ctx.fillStyle = '#ffffff'; }
							ctx.strokeStyle = '#000000';
							ctx.arc(x * blockSize + numSize + ~~(blockSize * 0.5) + 0.5, y * blockSize + numSize + ~~(blockSize * 0.5) + 0.5, blockSize / 2 * 0.8, 0, 2 * Math.PI, false);
							ctx.fill();
							ctx.stroke();
							ctx.globalAlpha = 1;

							turnCheck = 1;
							break;
						}
					}
					if( turnCheck != 0 ) { break; }
				}
			}
		}
	}

	// ボード脇の色を設定
	ctx.beginPath();
	ctx.fillStyle = '#000000';
	ctx.rect(0, 0, canvasSize + numSize, numSize);
	ctx.rect(0, 0, numSize, canvasSize + numSize);
	ctx.fill();

	// ボード脇の文字表示
	var boadWordVer = new Array('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
	var boadWordHor = new Array('1', '2', '3', '4', '5', '6', '7', '8');
	for( var i = 0; i < 8; i++ ) {
		// 文字の表示
		ctx.beginPath();
		ctx.font = numSize + "px 'ＭＳ Ｐゴシック', 'Osaka'";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = '#ffffff';
		ctx.fillText(boadWordVer[i], (i + 0.5) * blockSize + numSize + 0.5, numSize * 0.5);
		ctx.fillText(boadWordHor[i], numSize * 0.5, (i + 0.5) * blockSize + numSize + 0.5);
	}

	// 終了メッセージの表示
	if( gameEndFlag != 0 ) {
		// 帯の表示
		ctx.beginPath();
		ctx.fillStyle = '#eeeeee';
		ctx.globalAlpha = 0.7;
		ctx.rect(0, (canvasSize + numSize - msgSize) / 2, canvasSize + numSize, msgSize);
		ctx.fill();

		// 文字の表示
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = '#000000';
		ctx.font = msgSize + "px 'ＭＳ Ｐゴシック', 'Osaka'";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillText('B:' + blackStoneNum + ' vs W:' + whiteStoneNum, (canvasSize + numSize) / 2, (canvasSize + numSize) / 2);
	}
}



//----------------------------------------
// 配列のコピーメソッド
//----------------------------------------
Array.prototype.copy = function()
{
	var obj = new Array();

	for( var i = 0, len = this.length; i < len; i++ ) {
		if( this[i].length > 0 && this[i].copy() ) { obj[i] = this[i].copy(); }
		else { obj[i] = this[i]; }
	}

	return obj;
}



window.onload = function()
{
	// 初期設定
	init();
}