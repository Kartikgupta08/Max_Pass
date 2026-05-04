const MMD = {
  generateBatteries: (count = 52) => {
    const categories = ['ESS', '2W', '3W', '4W']
    const networks = ['4G', 'LTE', '5G']
    const batteries = []
    for (let i = 1; i <= count; i++) {
      const isOnline = Math.random() > 0.3
      const isFaulty = Math.random() < 0.12
      const imei = String(860000000000000 + i)
      batteries.push({
        id: `BAT-${1000 + i}`,
        name: `Battery ${i}`,
        imei,
        status: isOnline ? 'Online' : 'Offline',
        faulty: isFaulty,
        network: networks[Math.floor(Math.random() * networks.length)],
        tag: categories[Math.floor(Math.random() * categories.length)],
        lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString(),
        speed: isOnline ? Math.floor(Math.random() * 80) : 0,
        distance: isOnline ? Math.floor(Math.random() * 120) : 0,
        address: ['Bangalore', 'Mumbai', 'Pune', 'Chennai', 'Delhi'][Math.floor(Math.random() * 5)],
        planEnds: new Date(Date.now() + Math.random() * 31536000000).toLocaleDateString()
      })
    }
    return batteries
  },

  generateTimeSeriesData: (points = 24, min = 0, max = 100) => {
    const data = []
    const labels = []
    const now = new Date()
    for (let i = points; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 3600000)
      labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      const val = Math.floor(Math.random() * (max - min + 1) + min)
      data.push(val)
    }
    return { labels, data }
  }
}

export default MMD