---
title: Debug Page
permalink: /debug/
pageLayout: page
---

<style scoped>
  #debug-info-container {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>

<div id="debug-info-container">
  <div id="debug-content"></div>
</div>

<script>
(function() {
  const API_URL = 'https://ip.lucas04.top';
  
  async function fetchDebugInfo() {
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      displayDebugInfo(data);
    } catch (error) {
      showError(error.message);
    }
  }
  
  function displayDebugInfo(data) {
    const container = document.getElementById('debug-content');
    let markdown = '';
    
    markdown += '## Client Debug Information\n\n';
    
    // IP Information
    if (data.IP) {
      const ipAddress = data.IP.IP || data.Headers['x-real-ip'] || 'Unknown';
      markdown += `## Your IP \n\n`;

      markdown += `\`**${ipAddress}**\`\n\n`;
      
      markdown += '## Location Information\n';
      markdown += '| **Field** | **Value** |\n';
      markdown += '|:-------:|:-------:|\n';
      markdown += `| Continent | ${data.IP.Continent || 'N/A'} |\n`;
      markdown += `| Country | ${data.IP.Country || 'N/A'} |\n`;
      markdown += `| Region | ${data.IP.Region || 'N/A'} (${data.IP.RegionCode || 'N/A'}) |\n`;
      markdown += `| City | ${data.IP.City || 'N/A'} |\n`;
      markdown += `| Coordinates | ${data.IP.Latitude || 'N/A'}, ${data.IP.Longitude || 'N/A'} |\n`;
      markdown += `| Postal Code | ${data.IP.PostalCode || 'N/A'} |\n`;
      markdown += `| Timezone | ${data.IP.Timezone || 'N/A'} |\n`;
      markdown += `| Metro Code | ${data.IP.MetroCode || 'N/A'} |\n\n`;
      
      markdown += '### Network Information\n\n';
      markdown += '| Field | Value |\n';
      markdown += '|-------|-------|\n';
      markdown += `| ASN | ${data.IP.ASN || 'N/A'} |\n`;
      markdown += `| AS Organization | ${data.IP.ASOrganization || 'N/A'} |\n`;
      markdown += `| Cloudflare Colo | ${data.IP.Colo || 'N/A'} |\n`;
      markdown += `| Is EU | ${data.IP.IsEU ? 'Yes' : 'No'} |\n\n`;
    }
    
    // Security Information
    if (data.Security) {
      markdown += '### Security & Protocol\n\n';
      markdown += '| Field | Value |\n';
      markdown += '|-------|-------|\n';
      markdown += `| HTTP Protocol | ${data.Security.httpProtocol || 'N/A'} |\n`;
      markdown += `| TLS Version | ${data.Security.tlsVersion || 'N/A'} |\n`;
      markdown += `| TLS Cipher | ${data.Security.tlsCipher || 'N/A'} |\n`;
      markdown += `| Client TCP RTT | ${data.Security.clientTcpRtt || 'N/A'} ms |\n\n`;
    }
    
    // Request Information
    markdown += '### Request Information\n\n';
    markdown += '| Field | Value |\n';
    markdown += '|-------|-------|\n';
    markdown += `| Method | ${data.Method || 'N/A'} |\n`;
    markdown += `| URL | ${data.Url || 'N/A'} |\n\n`;
    
    // Headers Section
    if (data.Headers) {
      markdown += '### HTTP Headers\n\n';
      markdown += '| Header | Value |\n';
      markdown += '|--------|-------|\n';
      
      for (const [key, value] of Object.entries(data.Headers)) {
        const escapedValue = String(value).replace(/\|/g, '\\|');
        markdown += `| ${key} | ${escapedValue} |\n`;
      }
      markdown += '\n';
    }
    
    // Convert markdown to HTML using a simple approach
    container.innerHTML = markdownToHtml(markdown);
  }
  
  function markdownToHtml(markdown) {
    let html = markdown;
    
    // Process tables first (before other replacements)
    html = html.replace(/(\|.+\n)+/g, function(tableBlock) {
      const lines = tableBlock.trim().split('\n');
      let tableHtml = '<table>';
      let inBody = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip separator row
        if (/^\|[\s\-:|\s]*\|$/.test(line)) {
          if (!inBody) {
            tableHtml += '</thead><tbody>';
            inBody = true;
          }
          continue;
        }
        
        // Split cells and remove empty ones from edges
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        
        if (i === 0) {
          // Header row
          tableHtml += '<thead><tr>';
          cells.forEach(cell => {
            tableHtml += `<th>${cell}</th>`;
          });
          tableHtml += '</tr>';
        } else {
          // Data row
          if (!inBody) {
            tableHtml += '</thead><tbody>';
            inBody = true;
          }
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
      
      tableHtml += '</tbody></table>';
      return tableHtml;
    });
    
    // Headers
    html = html
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Remove newlines around tables
      .replace(/\n+(<table>)/g, '$1')
      .replace(/(<\/table>)\n+/g, '$1\n\n')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `<div>${html}</div>`;
  }
  
  function showError(message) {
    const container = document.getElementById('debug-content');
    container.innerHTML = `<div class="error"><strong>⚠️ Error loading debug information</strong><br>${message}</div>`;
  }
  
  // Fetch debug info when page loads
  fetchDebugInfo();
})();
</script>
