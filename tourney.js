module.exports = {
    defaultConfig: {
      enabled: false,
    },
    // plugin meta data to better describe your plugin
    pluginName: 'TourneyScoreboard',
    pluginDescription: 'Scoreboarding',
    init(proxy, config) {
      proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: 'Init Special Sauce' });

      // Subscribe to api command events from the proxy here.
      // You can subscribe to specifc API commands. Event name is the same as the command string
      proxy.on('GetGuildSiegeMatchupInfoForSpectate', (req, resp) => {
        if (config.Config.Plugins[this.pluginName].enabled) {
          proxy.log({ type: 'info', source: 'plugin', name: this.pluginName, message: 'Processing' });
          this.decodeData(proxy, resp)
        }
      });
    },
    decodeData(proxy, data) {
      const user_lookup = data.wizard_info_list.reduce((prev, curr) => { 
          prev[curr.wizard_id] = curr;
          return prev;
      }, {})

      const guild1 = data.guild_list[0]
      const guild2 = data.guild_list[1]

      const g1Data = data.wizard_battle_log_list.filter(battle => user_lookup[battle.wizard_id].guild_id === guild1.guild_id).sort((a, b) => b.attack_win_count - a.attack_win_count)

      const g2Data = data.wizard_battle_log_list.filter(battle => user_lookup[battle.wizard_id].guild_id === guild2.guild_id).sort((a, b) => b.attack_win_count - a.attack_win_count)

      const g1Wins = g1Data.reduce((prev, curr) => {
          return prev + curr.attack_win_count
      }, 0)

      const g1Losses = g1Data.reduce((prev, curr) => {
          return prev + curr.attack_lose_count
      }, 0)

      const g2Wins = g2Data.reduce((prev, curr) => {
          return prev + curr.attack_win_count
      }, 0)

      const g2Losses = g2Data.reduce((prev, curr) => {
          return prev + curr.attack_lose_count
      }, 0)

      if (g1Wins === this.g1Wins &&
          g2Wins === this.g2Wins &&
          g1Losses === this.g1Losses &&
          g2Losses === this.g2Losses) { 
        proxy.log({ type: 'success', source: 'plugin', name: this.pluginName, message: `No update` });

        return
      }      

      this.g1Wins = g1Wins
      this.g1Losses = g1Losses
      this.g2Wins = g2Wins
      this.g2Losses = g2Losses

      req.on('error', error => {
        proxy.log({
          type: 'error',
          source: 'plugin',
          name: this.pluginName,
          message: `Upload failed: Server responded with code: ${error}`
        });
      })

      proxy.log({
        type: 'info',
        source: 'plugin',
        name: this.pluginName,
        message: `<html>
                    <div>${guild1.guild_name}: ${g1Wins}W ${g1Losses}L ${(g1Wins / (g1Wins + g1Losses) * 100).toFixed(2)} WR</div>
                    <div>${250 - g1Wins - g1Losses} attacks left</div>
                    <div>${guild2.guild_name}: ${g2Wins}W ${g2Losses}L ${(g2Wins / (g2Wins + g2Losses) * 100).toFixed(2)} WR</div>
                    <div>${250 - g2Wins - g2Losses} attacks left</div>
                  </html>
        `,
      });
    }
  };


  
