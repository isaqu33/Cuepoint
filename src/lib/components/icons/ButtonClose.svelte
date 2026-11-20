<script lang="ts">
  export let size: string = '28';
  export let color: string = 'black';
</script>

<div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size}>
    <line x1="20" y1="20" x2="80" y2="80" stroke={color} stroke-width="8" stroke-linecap="round"
    ></line>
    <line x1="80" y1="20" x2="20" y2="80" stroke={color} stroke-width="8" stroke-linecap="round"
    ></line>
  </svg>
</div>
