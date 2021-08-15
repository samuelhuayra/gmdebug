const folder = './data/';
const path = require('path');
const fs = require('fs')
const _ = require('lodash')
const { promisify } = require('util');
const moment = require('moment');

const readDirAsync = promisify(fs.readdir)
const readFileAsync = promisify(fs.readFile)
let dataplt = []

const run = async () => {
    const files = await readDirAsync(folder)
    for (let index = 0; index < files.length; index++) {
        const directoryPath = path.join(__dirname, folder, files[index]);
        //console.log(directoryPath);
        const fileResp = await readFileAsync(directoryPath, 'utf8');
        dataplt.push(JSON.parse(fileResp))

    }
    //console.log(dataplt)

    let text = "# Times\n";
    let arrPlants = []
    const plants = dataplt.map(dplt => {
        return dplt.data.map(pltarr => {
            return pltarr.data.map(plant => {
                //let time = moment(plant.activeTools.filter(tool => { return tool.type == 'WATER' })[0].startTime)
                let plantData = moment(plant.activeTools.filter(tool => { return tool.type == 'WATER' })[0].startTime).add(1, 'days')
                let currentDate = moment(new Date())
                let plantDate = currentDate.clone().set({ hour: plantData.hour(), minute: plantData.minutes(), second: plantData.seconds() })
                let plantjustDate = moment(plantData.clone().format('YYYY-MM-DD'))
                let curJustDate = moment(currentDate.clone().format('YYYY-MM-DD'))
                let daysDiff = curJustDate.diff(plantjustDate, 'days')
                let extraSec = daysDiff <= 0 ? 0 : daysDiff * 2;

                return {
                    plantId: plant.plantId,
                    plant: plant.plantElement,
                    coordinates: `${dplt.coor}`,
                    //coordinates: `x:${plant.land.x} y:${plant.land.y}`,
                    //timewater: dplt.passed ? moment(new Date()).set({ hour: time.hour(), minute: time.minutes(), second: time.seconds() }) : time.add(1, 'days'), //V2
                    //timelast: moment(plant.activeTools.filter(tool => { return tool.type == 'WATER' })[0].startTime).add(1, 'days'),//V1
                    //passed: dplt.passed,
                    plantjustDate: plantjustDate,
                    curJustDate: curJustDate,
                    days: daysDiff,
                    currentDate: currentDate,
                    timewaterutc: plant.activeTools.filter(tool => { return tool.type == 'WATER' })[0].startTime,
                    plantData: plantData,
                    timeok: plantDate.clone(),
                    timewater: plantDate.clone().add(extraSec, 'seconds')//V3
                }
            })
        })
    }).map(plt => {
        plt.map(plt1 => {
            plt1.map(plt2 => {
                arrPlants = [...arrPlants, plt2]
            })
        })
    })
    _.uniqBy(arrPlants.filter(plant => {
        return  plant.timewater.isSameOrAfter(moment(new Date())) //&& !plant.passed;
    }), (e) => {
            return e.plantId;
        }).sort((a, b) => {
            return a.timewater - b.timewater
        }).map(currentValue => {
            //Debug
/*             text += '\n```' +
                `
Coor: ${currentValue.coordinates}
${currentValue.plantId}
Type: ${currentValue.plant}

Current date: ${currentValue.currentDate}
plant date: ${currentValue.plantData},
plant date utc: ${currentValue.timewaterutc}
Timeok: ${currentValue.timeok}
plantjustDate: ${currentValue.plantjustDate}
curJustDate: ${currentValue.curJustDate}
Days passed: ${currentValue.days}
timewater: ${currentValue.timewater}`
                + '\n```' */
                text += '\n```' +
                `
Coor: ${currentValue.coordinates}
${currentValue.plantId}
Type: ${currentValue.plant}
Days passed: ${currentValue.days}
Time water: ${currentValue.timewater}`
                + '\n```'
        })
    fs.writeFile(`times.md`, text, (err) => {
        if (err) throw err;
        console.log('File is created successfully.')
    });
}
run()