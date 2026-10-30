# 城市反恐：破曉行動（全班連線版）

課堂手機遊戲：全班都是特勤隊員，各自在手機上執行同一場反恐任務（第一人稱射擊，手機橫向；電腦可用滑鼠鍵盤）。老師的電腦是指揮中心大螢幕：選難度、開始任務、看全景與各組平均分數，最後翻牌公布成績。

- 老師（電腦，接投影機）：https://op06dhans-eng.github.io/Gun-movie/
- 學生（掃老師畫面上的 QR Code，進課堂遊戲大廳）：https://op06dhans-eng.github.io/Gun-movie/go.html
- 學生直接進遊戲：https://op06dhans-eng.github.io/Gun-movie/play.html
- 同一台電腦練習連線（開兩個分頁，一個老師一個學生）：https://op06dhans-eng.github.io/Gun-movie/preview.html

## 任務
虛構的武裝組織「黑鴉」占領港灣市的商店街，把 3 名人質關在廣場旁的民宅裡，並在街尾放了炸彈。任務分四段，一段清完，電腦會帶同學跑到下一個掩體：
1. 突破路障（街上有逃跑的平民，誤傷扣分）
2. 清除街口（屋頂出現槍手）
3. 攻入民宅救人質（室內近距離作戰：前廳 → 後房 → 人質房，限時；時間到人質會被押走；誤傷人質重扣分）
4. 拆除炸彈（進入後開始倒數；清完敵人後按住拆彈 4 秒）

掩體：同學平常蹲在掩體後面（敵人打不到、血量回復），按瞄準或開火才探身射擊；準心對到這一段其他掩體時出現「前往掩體」（電腦按空白鍵）。武器：M4 卡賓槍加 3 倍瞄準鏡。敵人頭巾蒙面、拿 AK 步槍。

全班對抗老師：任務進行中，老師是虛構武裝組織「黑鴉」的指揮官。
- 指揮官：每 15 秒得 1 點指令點數（最多 8 點），可以派增援槍手、屋頂狙擊手、催促押走人質、讓炸彈加速、在炸彈旁埋伏；指令同時出現在全班的遊戲裡。
- 屋頂狙擊手：老師親自上屋頂（街口或街尾），用第一人稱看到全班同學（每秒 5 次更新位置），右鍵站起來用 4 倍瞄準鏡、左鍵開火；同學躲在掩體後打不到，探身時才打得到。老師站起來瞄準時，同學也看得到屋頂上的「老師」並能反擊，擊倒老師 +500。

翻牌（共 11 頁）：任務結果、全班戰報、個人表現、老師 vs 全班，接著揭露「你們打倒的敵人長什麼樣子／平民和人質長什麼樣子」、「這是老師指定的」、研究資料（Shaheen 2003；Höglund 2008；Šisler 2008；《美國陸軍》2002）、現實數據（Europol TE-SAT 2026；GAO-17-300），最後是軍事娛樂複合體討論題。

難度：普通（人質 60 秒、炸彈 90 秒）、困難（人質 45 秒、炸彈 70 秒，敵人較多較準）。任務時間預設 5 分鐘。

計分：擊倒 100、爆頭 150、救出人質每人 200、拆彈 500＋剩餘秒數×3；誤傷人質或平民 −300、被擊倒 −100。

（舊版「片場：戰爭片拍攝中」v1.3.0 保留在 git 紀錄中。）

## 素材出處
- 人物：[Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox)（MIT），由 [mini-cry](https://github.com/vvanghelue/mini-cry) 轉成 glTF（迷彩重新上色、徽章塗掉）。
- 動作：Quaternius Universal Animation Library（CC0），以 mini-cry 的重定向程式（ISC）離線烘焙到上述人體骨架。
- 第一人稱手臂：Rocketbox Military_Male_03（MIT）；手臂 IK 程式移植自 mini-cry（ISC）。
- 步槍：M4A1 by [TORI106](https://sketchfab.com/3d-models/m4a1-33107f38b23c45cc8103768c0e961cdf)（CC-BY 4.0）；AKM by LonesomeDucky（OpenGameArt，CC0）。
- 裝甲車：[BTR 80 by Goga.Danelia](https://sketchfab.com/3d-models/2980ab7cbc4d41b7893e3233e9dcc1ce)（CC-BY 4.0）。休旅車：[Mercedes-Benz G-Class 2021 by ItsDiyor](https://sketchfab.com/3d-models/1768618c049b49fcb0d09a86d6f67c8d)（CC-BY 4.0）。兩者經 [offroad](https://github.com/Arz-Gev/offroad) 壓縮，本專案再縮小貼圖與面數。
- 槍口火光：真實照片去背（offroad 專案製作）：Muzzle flash VFX 1–5 by ZunterPHOTO（Wikimedia Commons，CC0）、"Light 'Em Up" 美國海軍陸戰隊（公共領域）。
- 材質：[ambientCG](https://ambientcg.com)（CC0，經 null3d sample-assets 整理）、[Poly Haven](https://polyhaven.com)（CC0）。天空：Poly Haven kloofendal_48d_partly_cloudy_puresky（CC0）。
- 槍聲：Freesound（CC0）：ninebilly（AK 連發）、michorvath（AR15、9mm、霰彈槍）、hyperix6（Colt SMG 換彈）、jackthemurray（AR15 槍機）、brianhanson2nd（空槍）。
- QR Code：Kazuhiko Arase 的 qrcode.js（MIT）。

本遊戲中的國家、城市、組織與人物皆為虛構。
