<script lang="ts">
  export const size: string = '20'; // Tamanho do ícone
  export const color: string = 'black'; // Cor do ícone
</script>

<div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size}>
    <path
      d="M32 12C18 12 6.73 24.24 4 32c2.73 7.76 14 20 28 20s25.27-12.24 28-20c-2.73-7.76-14-20-28-20z"
      fill="none"
      stroke={color}
      stroke-width="4"
    ></path>
    <circle cx="32" cy="32" r="8" fill={color}></circle>
  </svg>
</div>
