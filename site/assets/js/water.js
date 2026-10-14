/* "Lake" field: a slow, satin-like water surface drawn with WebGL.
   Domain-warped noise gives the shape; finite differences give a normal for soft
   light and a specular sheen. Renders at reduced resolution, pauses off-screen,
   draws one still frame for reduced motion, and leaves the CSS gradient in place
   when WebGL is unavailable. */
(function () {
  "use strict";

  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec2 uFocus;uniform float uOct;",
    "vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}",
    "float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
    " return mix(mix(dot(h2(i),f),dot(h2(i+vec2(1.,0.)),f-vec2(1.,0.)),u.x),mix(dot(h2(i+vec2(0.,1.)),f-vec2(0.,1.)),dot(h2(i+vec2(1.)),f-vec2(1.)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){if(float(i)>=uOct)break;v+=a*n2(p);p=m*p;a*=.5;}return v;}",
    /* Silk: a slow warped field turned into soft folds. */
    "float silk(vec2 p,float t){",
    " vec2 w=vec2(fbm(p*.9+vec2(0.,t*.05)),fbm(p*.9+vec2(4.1,1.7)-t*.04));",
    " float f=fbm(p+1.6*w+vec2(t*.02,0.));",
    " return .5+.5*sin(f*8.5+p.x*1.3-p.y*.7+t*.2);}",
    "void main(){",
    " vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;",
    " vec2 q=p*.62+uMouse*.035+vec2(.3,.1);",
    " float t=uTime;",
    " float h=silk(q,t);",
    " float e=.012;",
    " float hx=silk(q+vec2(e,0.),t),hy=silk(q+vec2(0.,e),t);",
    " vec3 n=normalize(vec3((h-hx)/e*.2,(h-hy)/e*.2,1.));",
    " vec3 l=normalize(vec3(-.5,.6,.65));",
    " float dif=clamp(dot(n,l),0.,1.);",
    " float spc=pow(clamp(dot(reflect(-l,n),vec3(0.,0.,1.)),0.,1.),22.);",
    " vec3 c0=vec3(.027,.035,.047);",
    " vec3 c1=vec3(.03,.06,.2);",
    " vec3 c2=vec3(.2,.36,1.);",
    " vec3 c3=vec3(.58,.6,1.);",
    " vec3 c4=vec3(.86,.89,1.);",
    " vec3 col=mix(c1,c2,smoothstep(.15,.95,h)*dif);",
    " col=mix(col,c3,smoothstep(.6,1.,h)*pow(dif,3.)*.9);",
    " col+=c4*spc*.8*smoothstep(.25,.9,h);",
    " col*=.3+.95*dif;",
    " float m=smoothstep(1.35,.15,length((p-uFocus)*vec2(.85,1.15)));",
    " col=mix(c0,col,m);",
    " float g=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5453);",
    " col+=(g-.5)*.012;",
    " gl_FragColor=vec4(col,1.);",
    "}"
  ].join("\n");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia("(max-width: 760px)").matches;

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function start(canvas) {
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) { canvas.remove(); return; }
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch (e) { canvas.remove(); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "uRes");
    var uTime = gl.getUniformLocation(prog, "uTime");
    var uMouse = gl.getUniformLocation(prog, "uMouse");
    var uFocus = gl.getUniformLocation(prog, "uFocus");
    var uOct = gl.getUniformLocation(prog, "uOct");
    var focus = (canvas.getAttribute("data-focus") || (small ? "0.05,0.42" : "0.55,0.22")).split(",").map(Number);
    if (small && canvas.hasAttribute("data-focus")) focus = [0.05, -0.1];
    gl.uniform2f(uFocus, focus[0], focus[1]);
    gl.uniform1f(uOct, small ? 3 : 4);

    var scale = small ? 0.42 : 0.55;
    function resize() {
      var w = Math.max(2, Math.round(canvas.clientWidth * scale));
      var h = Math.max(2, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    }
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener("pointermove", function (e) {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    var visible = true, raf = 0, t0 = performance.now(), seed = Math.random() * 40;
    function frame(now) {
      raf = 0;
      resize();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, seed + (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });
    window.addEventListener("resize", kick);
    canvas.classList.add("is-live");
    kick();
  }

  document.querySelectorAll("canvas[data-water]").forEach(start);
})();
