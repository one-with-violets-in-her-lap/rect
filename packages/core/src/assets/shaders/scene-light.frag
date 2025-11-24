in vec2 vTextureCoord;
in vec4 vColor;

uniform sampler2D uTexture;
uniform float uTime;

void main(void)
{
  vec2 uvs = vTextureCoord.xy;

  vec4 fg = texture2D(uTexture, vTextureCoord);

  fg.rgb *= 0.4;

  gl_FragColor = fg;
}
