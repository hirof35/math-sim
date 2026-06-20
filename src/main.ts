// 1. ベクトル計算クラス
class MathVector {
  constructor(public x: number, public y: number) {}

  get magnitude(): number {
      return Math.hypot(this.x, this.y);
  }

  dot(other: MathVector): number {
      return this.x * other.x + this.y * other.y;
  }

  angleWith(other: MathVector): number {
      const mag1 = this.magnitude;
      const mag2 = other.magnitude;
      if (mag1 === 0 || mag2 === 0) return 0;
      const cosTheta = this.dot(other) / (mag1 * mag2);
      return Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  }

  drawArrow(ctx: CanvasRenderingContext2D, originX: number, originY: number, color: string, label: string) {
      const targetX = originX + this.x;
      const targetY = originY - this.y; // 画面座標系を数学座標系へ変換

      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      const angle = Math.atan2(-this.y, this.x);
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX - 12 * Math.cos(angle - Math.PI / 6), targetY - 12 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(targetX - 12 * Math.cos(angle + Math.PI / 6), targetY - 12 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 掴みやすいように先端に薄いガイド円を描画
      ctx.beginPath();
      ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
      ctx.fillStyle = color + "33"; // 透明度付き
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(label, targetX + 12, targetY - 12);
  }
}

// 2. シミュレーター制御クラス
class VectorVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originX: number;
  private originY: number;

  private vecA = new MathVector(120, 90);
  private vecB = new MathVector(150, -40);
  private activeVector: MathVector | null = null;

  // HTMLのUI要素
  private elVecA = document.getElementById('textVecA')!;
  private elVecB = document.getElementById('textVecB')!;
  private elDot = document.getElementById('textDot')!;
  private elAngle = document.getElementById('textAngle')!;
  private elBadge = document.getElementById('statusBadge')!;

  constructor(canvasId: string) {
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      this.ctx = this.canvas.getContext('2d')!;
      this.originX = this.canvas.width / 2;
      this.originY = this.canvas.height / 2;

      this.setupEvents();
      this.startLoop();
  }

  private setupEvents() {
      const getMousePos = (e: MouseEvent) => {
          const rect = this.canvas.getBoundingClientRect();
          return {
              x: e.clientX - rect.left - this.originX,
              y: this.originY - (e.clientY - rect.top)
          };
      };

      this.canvas.addEventListener('mousedown', (e) => {
          const mouse = getMousePos(e);
          if (Math.hypot(this.vecA.x - mouse.x, this.vecA.y - mouse.y) < 20) {
              this.activeVector = this.vecA;
          } else if (Math.hypot(this.vecB.x - mouse.x, this.vecB.y - mouse.y) < 20) {
              this.activeVector = this.vecB;
          }
      });

      this.canvas.addEventListener('mousemove', (e) => {
          if (!this.activeVector) return;
          const mouse = getMousePos(e);
          this.activeVector.x = Math.round(mouse.x);
          this.activeVector.y = Math.round(mouse.y);
      });

      window.addEventListener('mouseup', () => {
          this.activeVector = null;
      });
  }

  private drawGrid() {
      this.ctx.strokeStyle = '#e2e8f0';
      this.ctx.lineWidth = 1;
      
      // 補助目盛り線（グリッド）
      for(let i = 50; i < this.canvas.width; i += 50) {
          this.ctx.beginPath();
          this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height);
          this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i);
          this.ctx.stroke();
      }

      // メインのx軸・y軸
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.originY); this.ctx.lineTo(this.canvas.width, this.originY);
      this.ctx.moveTo(this.originX, 0); this.ctx.lineTo(this.originX, this.canvas.height);
      this.ctx.stroke();
  }

  private updateUI() {
      const dotProduct = this.vecA.dot(this.vecB);
      const angleDeg = (this.vecA.angleWith(this.vecB) * 180) / Math.PI;

      // 文字列の更新
      this.elVecA.textContent = `a = (${this.vecA.x}, ${this.vecA.y})`;
      this.elVecB.textContent = `b = (${this.vecB.x}, ${this.vecB.y})`;
      this.elDot.textContent = `a ・ b = ${Math.round(dotProduct)}`;
      this.elAngle.textContent = `なす角 θ = ${angleDeg.toFixed(1)}°`;

      // 状態判定とバッジのスタイリング変更
      if (Math.abs(dotProduct) < 0.1) {
          this.elBadge.textContent = '垂直 (θ = 90°)';
          this.elBadge.style.backgroundColor = '#007bff';
      } else if (dotProduct > 0) {
          this.elBadge.textContent = '鋭角 (0° ≤ θ < 90°)';
          this.elBadge.style.backgroundColor = '#28a745';
      } else {
          this.elBadge.textContent = '鈍角 (90° < θ ≤ 180°)';
          this.elBadge.style.backgroundColor = '#dc3545';
      }
  }

  private render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawGrid();
      
      // ベクトルの描画
      this.vecA.drawArrow(this.ctx, this.originX, this.originY, '#dc3545', 'a');
      this.vecB.drawArrow(this.ctx, this.originX, this.originY, '#007bff', 'b');
      
      this.updateUI();
  }

  private startLoop() {
      const loop = () => {
          this.render();
          requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
  }
}

// アプリケーションの起動
new VectorVisualizer('geoCanvas');