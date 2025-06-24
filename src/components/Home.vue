<template>
  <div>
    <h1>Welcome to the Home Page</h1>
    <div v-html="renderedMarkdown"></div>
  </div>
</template>

<script>
  import markdownParser from '../utils/markdown';

  export default {
    data() {
      return {
        markdownContent: '',
      };
    },
    async created() {
      try {
        const response = await fetch('../../docs/home.md');
        this.markdownContent = await response.text();
      } catch (error) {
        console.error('Error fetching markdown:', error);
      }
    },
    computed: {
      renderedMarkdown() {
        return markdownParser(this.markdownContent);
      },
    },
  };
</script>
