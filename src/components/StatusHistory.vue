<template>
<div>

</div>
</template>
<script>
import {Line} from 'vue-chartjs'

export default {
    name:'statusHistory',
    extends: Line,
    mounted(){
        let vm = this
        vm.renderChart(
            {
                labels:['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets:[
                    {
          label: 'Data One',
          backgroundColor: '#FC2525',
          data: [40, 39, 10, 40, 39, 80, 40]
        },{
          label: 'Data Two',
          backgroundColor: '#05CBE1',
          data: [60, 55, 32, 10, 2, 12, 53]
        }
      
                ]
            }, {responsive: true, maintainAspectRatio:false}
        )
    }
}
</script>

<style scoped>

</style>


