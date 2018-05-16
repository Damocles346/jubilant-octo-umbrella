
function clearOutput() {
  var $editArea = $(".edit-block").first();
  $editArea.empty();
  $('.btn-edit').hide();
  $('.btn-image').hide();
  $('.btn-print').hide();
}

function generateShip() {

  $('.btn-edit').show();
  $('.btn-image').show();
  $('.btn-print').show();

  thrusterArray = []
  while (thrusterArray.length == 0) {
    var shipBlock = {};

    var tier = $('#tierPicker').val().trim().replace('Tier ','').replace('Any tier',Object.keys(shipTiers).selectRandom());
    var frame = $('#framePicker').val().trim().replace('Any frame',Object.keys(shipFrames).selectRandom());
    var weapons = $('#weaponPicker').val().trim().replace(" armed","").replace('Any armament',["Not","Lightly","Heavily"].selectRandom());

    shipBlock.tier = tier
    shipBlock.frame = frame

    var buildPoints = 0;
    var powerCoreUnits = 0;

    buildPoints = shipTiers[tier].SBP;

    //FRAME

    frameObj = shipFrames[frame]

    shipBlock.size = shipSizes[frameObj.size]
    shipBlock.maneuverability = frameObj.maneuverability
    //frame values
    for (value in frameObj.value) {
      shipBlock[value] = frameObj.value[value];
    }
    buildPoints -= frameObj.cost.BP

    //HP INCREASE
    for (var i = 0; i < shipTiers[tier].hpIncrease; i++) {
      shipBlock.HP += shipBlock.HPIncrement
    }

    //POWER CORE
    var corearray = getCores(frameObj.size,buildPoints)

    var $outputArea = $(".output.area").first();
    $outputArea.empty();

    if (corearray.length > 0) {
      shipBlock.core = corearray.selectRandom()
      shipBlock.PCU = shipPowerCores[shipBlock.core].value.PCU

      buildPoints -= shipPowerCores[shipBlock.core].cost.BP
      powerCoreUnits = shipBlock.PCU
    }

    //THRUSTERS
    var thrusterArray = getThrusters(frameObj.size,buildPoints,powerCoreUnits)

    if (thrusterArray.length == 0 && !$('#tierPicker').val().includes('Any')) {
      if (!$('#framePicker').val().includes('Any')) {
        clearOutput()
        $outputArea.append('<p>This Tier and Frame combo will not work. Not enough Build Points.</p>');
        return
      }


    }

  }


  shipBlock.thrusters = thrusterArray.selectRandom();
  var thrusterObj = shipThrusters[shipBlock.thrusters]

  shipBlock.speed = thrusterObj.value.hexSpeed;
  shipBlock.piloting += thrusterObj.value.piloting;

  buildPoints -= thrusterObj.cost.BP
  powerCoreUnits -= thrusterObj.cost.PCU

  //WEAPONS
  mounts = frameObj.mounts
  mountKeys = Object.keys(mounts)

  if (weapons.includes("Lightly")) {
    mountList = shuffle(["ForwardArc","Turret"]);
  } else if (weapons.includes("Heavily")) {
    mountList = shuffle(["ForwardArc","Turret","PortArc","StarboardArc","AftArc"]);
  } else if (weapons.includes("Not")) {
    mountList = [];
  } else {
    console.log("error")
  }

  shipBlock.mounts = {};
  shipBlock.mounts.Turret = [];
  shipBlock.mounts.ForwardArc = [];
  shipBlock.mounts.AftArc = [];
  shipBlock.mounts.PortArc = [];
  shipBlock.mounts.StarboardArc = [];

  for (var i = 0; i < mountList.length; i++) {
    if (mountKeys.includes(mountList[i])) {

      for (weaponClass in mounts[mountList[i]]) {
        //check if theres enough BP
        if (buildPoints > 0) {

          var weaponNum = mounts[mountList[i]][weaponClass];
          var randWeapons = getRandomInt(1, weaponNum);

          for (var j = 0; j < randWeapons; j++) {
            var weaponArray = getWeapons(weaponClass.capitalise(),buildPoints,powerCoreUnits)
            if (weaponArray.length > 0){
              var weapon = weaponArray.selectRandom()
              shipBlock.mounts[mountList[i]].push(weapon + " (" + shipWeapons[weapon].damage + ")" )
              buildPoints -= shipWeapons[weapon].cost.BP
              powerCoreUnits -= shipWeapons[weapon].cost.PCU
            }
          }
        }
      }
    }
  }

  shipBlock.AC = 10;
  shipBlock.TL = 10;
  shipBlock.systems = [];
  shipBlock.modifiers = [];

  if (shipBlock.piloting != 0) {
    shipBlock.modifiers.push(("+" + shipBlock.piloting.toString() + " Piloting").replace('+-','-'))
  }

  shipBlock.complement = getRandomInt(shipBlock.minCrew, shipBlock.maxCrew);
  if (Math.abs(shipBlock.complement % 2) == 1 && shipBlock.complement > 1) {
    shipBlock.complement = shipBlock.complement - 1;
  }

  //ESSENTIAL SYSTEMS
  var essentialSystems = shuffle(["shipArmor","shipComputers","shipShields","shipDefenses"]);

  for (var i = 0; i < essentialSystems.length; i++) {
    if (essentialSystems[i] == "shipArmor") {
      var armorArray = getArmor(frameObj.size,buildPoints);
      if (armorArray.length > 0){
        var armor = armorArray.selectRandom()
        shipBlock.armor = armor;
        shipBlock.systems.push(armor);
        shipBlock.AC = shipBlock.AC + shipArmor[armor].value.AC;
        shipBlock.TL = shipBlock.TL + shipArmor[armor].value.TL;
        shipBlock.turn = shipBlock.turn + shipArmor[armor].value.turn;
        buildPoints -= shipArmor[armor].BPCostMultiplier * frameObj.size;
      }

    } else if (essentialSystems[i] == "shipComputers") {
      var computer = getComputers(buildPoints,powerCoreUnits).selectRandom()
      shipBlock.computer = computer;
      shipBlock.systems.push(computer + " computer");
      if (computer != "Basic") {
        var modstring = "+" + shipComputers[computer].value.computerBonus + " any " + shipComputers[computer].value.computerNodes.toString().replace('1','one check').replace('2','two checks').replace('3','three checks').replace('4','four checks') + " per round";
        shipBlock.modifiers.push(modstring)
      }
      buildPoints -= shipComputers[computer].cost.BP;
      powerCoreUnits -= shipComputers[computer].cost.PCU

    } else if (essentialSystems[i] == "shipShields") {
      var shieldArray = getShields(buildPoints,powerCoreUnits);
      if (shieldArray.length > 0){
        var shield = shieldArray.selectRandom()
        shipBlock.shield = shield;
        shipBlock.SP = shipShields[shield].value.SP;
        shipBlock.SPSplit = shipShields[shield].value.SP / 4;
        shipBlock.shieldRegen = shipShields[shield].value.shieldRegen;

        if (shipBlock.SPSplit % 1 != 0) {
          shipBlock.SPForward = Math.floor(shipBlock.SPSplit) + 2;
          shipBlock.SPSplit = Math.floor(shipBlock.SPSplit);
        } else {
          shipBlock.SPForward = shipBlock.SPSplit
        }

        buildPoints -= shipShields[shield].cost.BP;
        powerCoreUnits -= shipShields[shield].cost.PCU
      }

    } else if (essentialSystems[i] == "shipDefenses") {

      var defenseArray = getDefenses(buildPoints,powerCoreUnits);
      if (defenseArray.length > 0){
        var defense = defenseArray.selectRandom()
        shipBlock.defense = defense;
        shipBlock.systems.push(defense);
        shipBlock.TL = shipBlock.TL + shipDefenses[defense].value.TL;

        buildPoints -= shipDefenses[defense].cost.BP;
        powerCoreUnits -= shipDefenses[defense].cost.PCU
      }
    }
  };

  //OTHER SYSTEMS
  var otherSystems = shuffle(["shipDriftEngines","shipSensors","shipQuarters","shipExpansionBays"]);//,"shipExpansionBays","shipSecurity"
  for (var i = 0; i < otherSystems.length; i++) {
    if (otherSystems[i] == "shipDriftEngines") {
      var driftArray = getDriftEngine(frameObj.size,buildPoints,shipBlock.PCU);

      if (driftArray.length > 0){
        var engine = driftArray.selectRandom()
        shipBlock.driftEngine = engine;
        shipBlock.driftRating = shipDriftEngines[engine].value.driftEngineRating;
        buildPoints -= shipDriftEngines[engine].BPCostMultiplier * frameObj.size;
      }

    } else if (otherSystems[i] == "shipSensors") {
      shipBlock.sensorMod = ""
      var sensorArray = getSensors(buildPoints);

      if (sensorArray.length > 0){
        var sensor = sensorArray.selectRandom()
        shipBlock.systems.push(sensor + " sensors");
        buildPoints -= shipSensors[sensor].cost.BP;
        if (shipSensors[sensor].sensorMod != "+0")
        shipBlock.modifiers.push(shipSensors[sensor].sensorMod + " Computers");
      }

    } else if (otherSystems[i] == "shipQuarters") {
      if (frameObj.size > 1) {
        var quarters = ["Common"]
        if (buildPoints >= 2){quarters.push("Good")}
        if (buildPoints >= 5){quarters.push("Luxurious")}

        var quarter = quarters.selectRandom()
        shipBlock.systems.push("crew quarters (" + quarter.toLowerCase() + ")");
        buildPoints -= shipQuarters[quarter].cost.BP;
      }

    } else if (otherSystems[i] == "shipExpansionBays") {

      var cargoHolds = getRandomInt(0, shipBlock.ExpansionBays);
      var remainingBays = shipBlock.ExpansionBays - cargoHolds
      var baySelections = [];
      var bayNumbers = [];

      for (var j = 0; j < remainingBays; j++) {
        var bayArray = getExpansionBays(frameObj.size,buildPoints,powerCoreUnits,remainingBays-j);
        if (bayArray.length > 0) {
          var bay = bayArray.selectRandom()
          if (bay == "Hangar bay") {
            j += 3
          }
          if (baySelections.includes(bay)){
            bayNumbers[baySelections.indexOf(bay)] = bayNumbers[baySelections.indexOf(bay)] += 1;
          } else {
            baySelections.push(bay);
            bayNumbers.push(1)
          }
          buildPoints -= shipExpansionBays[bay].cost.BP;
          powerCoreUnits -= shipExpansionBays[bay].cost.PCU
        }
      }

      //recover cargo bays
      if (bayNumbers.length > 0) {
        var baySum = bayNumbers.reduce(function(acc, val) { return acc + val; });
      } else {
        var baySum = 0;
      }
      cargoHolds += (remainingBays - baySum);
      if (baySelections.includes("Hangar bay")) {
        cargoHolds -= bayNumbers[baySelections.indexOf("Hangar bay")] * 3;
      }

      if (cargoHolds > 0) {
        baySelections.push("cargo hold");
        bayNumbers.push(cargoHolds)
      }

      shipBlock.expansionBayArray = [];

      if (baySelections.length > 0) {
        for (var k = 0; k < baySelections.length; k++) {
          var bayString = baySelections[k];
          if (bayString == "Guest quarters") {
            bayString += [" (common)"," (good)"," (luxurious)"].selectRandom();
          }
          if (bayNumbers[k] > 1) {
            if (bayString.includes(" (")) {
              bayString = bayString.replace(' (','s (');
              bayString += " (" + bayNumbers[k] + ")";
            } else {
              bayString += "s (" + bayNumbers[k] + ")";
            }
            bayString = bayString.replace('boatss','boats').replace('seatings','seating');
          }
          shipBlock.expansionBayArray.push(bayString.toLowerCase());
        }
      }
    }


  };
  //CREW
  captainSkills = ["Bluff","Diplomacy","Computers","Engineering","Gunnery","Intimidate","Piloting"]
  rank = " (" + shipBlock.tier.replace('1/2','1').replace('1/3','1').replace('1/4','1') + " rank)"
  masterSkill = captainSkills.selectRandom()
  shipBlock.captain = []
  for (var i = 0; i < captainSkills.length; i++) {
    if (captainSkills[i] == masterSkill) {
      shipBlock.captain.push(captainSkills[i] + " +" + crewBaseStats[shipBlock.tier][0] + rank)
    } else {
      shipBlock.captain.push(captainSkills[i] + " +" + crewBaseStats[shipBlock.tier][1] + rank)
    }
  }

  //PRINT
  displayShipBlock(shipBlock)

}

function displayShipBlock(shipBlock) {
    //
    //Ship Block
    //

    textBlock = "";
    //description
    textBlock += '<hr>';
    textBlock += leftAndRight('<b>' + "Name" + '</b>','<b>TIER '+ shipBlock.tier +'</b>');
    textBlock += '<hr>';
    textBlock += "<div>" + shipBlock.size + " " + shipBlock.frame.toLowerCase() + "</div>";
    textBlock += "<div>" + "<b>Speed</b> " + shipBlock.speed + "; " + "<b>Maneuverability</b> " + shipBlock.maneuverability + " (" + shipBlock.turn + " turn)";
    if (shipBlock.hasOwnProperty('driftRating')) {
      textBlock += "; <b>Drift</b> " + shipBlock.driftRating;
    }
    textBlock += "</div>"
    textBlock += "<div>" + "<b>AC</b> 22; " + "<b>TL</b> 22" + "</div>";
    textBlock += "<div>" + "<b>HP </b>" + shipBlock.HP + "; " + "<b>DT</b> " + shipBlock.DT + "; <b>CT</b> " + shipBlock.CT + "</div>";
    if (shipBlock.hasOwnProperty('shield')) {
      textBlock += "<div>" + "<b>Shields</b> " + shipBlock.shield + " (forward " + shipBlock.SPForward + ", port " + shipBlock.SPSplit + ", starboard " + shipBlock.SPSplit + ", aft " + shipBlock.SPSplit + ")" + "</div>";
    } else {
      textBlock += "<div>" + "<b>Shields</b> none" + "</div>";

    }

    if (shipBlock.mounts.ForwardArc.length > 0) {
      textBlock += "<div>" + "<b>Attack (Forward)</b> " + shipBlock.mounts.ForwardArc.join(', ') + "</div>";
    }
    if (shipBlock.mounts.PortArc.length > 0) {
      textBlock += "<div>" + "<b>Attack (Port)</b> " + shipBlock.mounts.PortArc.join(', ') + "</div>";
    }
    if (shipBlock.mounts.StarboardArc.length > 0) {
      textBlock += "<div>" + "<b>Attack (Starboard)</b> " + shipBlock.mounts.StarboardArc.join(', ') + "</div>";
    }
    if (shipBlock.mounts.AftArc.length > 0) {
      textBlock += "<div>" + "<b>Attack (Aft)</b> " + shipBlock.mounts.AftArc.join(', ') + "</div>";
    }
    if (shipBlock.mounts.Turret.length > 0) {
      textBlock += "<div>" + "<b>Attack (Turret)</b> " + shipBlock.mounts.Turret.join(', ') + "</div>";
    }

    textBlock += "<div>" + "<b>Power Core</b> " + shipBlock.core + " (" + shipBlock.PCU + " PCU)"
    if (shipBlock.hasOwnProperty('driftEngine')) {
      textBlock += "; <b>Drift Engine</b> " + shipBlock.driftEngine;
    }
    if (shipBlock.systems.length != 0) {
      shipBlock.systems = shipBlock.systems.sort();
      textBlock += "; <b>Systems</b> " + shipBlock.systems.join(', ').toLowerCase()

    }
    if (shipBlock.expansionBayArray.length > 0) {
      shipBlock.expansionBayArray = shipBlock.expansionBayArray.sort();
      textBlock += "; <b>Expansion Bays</b> " + shipBlock.expansionBayArray.join(', ').toLowerCase()
    } else {
      textBlock += "; <b>Expansion Bays</b> none";
    }

    textBlock += "</div>"

    if (shipBlock.modifiers.length != 0) {
      shipBlock.modifiers = shipBlock.modifiers.sort();
      textBlock += "<div>" + "<b>Modifiers</b> " + shipBlock.modifiers.join(', ');
    }
    textBlock += "; <b>Complement</b> " + shipBlock.complement;
    textBlock += "</div>"

    textBlock += "<div><b>CREW</b></div>";
    textBlock += '<hr>';
    textBlock += "<div>" + "<b>Captain</b> " + shipBlock.captain.join(', ') + "</div>";

    var $StatBlock = $(".summernoteEdit").first();
    $StatBlock.empty();
    $StatBlock.append(textBlock);
}

//returns a string div with right aligned and left alignedtext on the same line
function leftAndRight(left,right){
  return '<div class="row"><div class="col-xs-8"><div>' + left + '</div></div><div class="col-xs-4"><div class="text-right">' + right + '</div></div></div>'
}

//return the cores for a particular ship size. integer
function getCores(size,buildPoints) {
  var cores = []
  for (core in shipPowerCores) {
    if (size <= shipPowerCores[core].maxSize && size >= shipPowerCores[core].minSize && shipPowerCores[core].cost.BP <= buildPoints) {
      cores.push(core)
    }
  }
  return cores
}

//return available thrusters
function getThrusters(size,buildPoints,powerCoreUnits) {
  var thrusters = []
  for (thruster in shipThrusters) {
    if (size == shipThrusters[thruster].size && shipThrusters[thruster].cost.BP <= buildPoints && shipThrusters[thruster].cost.PCU <= powerCoreUnits) {
      thrusters.push(thruster)
    }
  }
  return thrusters
}

function getWeapons(weaponClass,buildPoints,powerCoreUnits) {
  var weapons = []
  for (weapon in shipWeapons) {
    if (weaponClass == shipWeapons[weapon].class && shipWeapons[weapon].cost.BP <= buildPoints && shipWeapons[weapon].cost.PCU <= powerCoreUnits) {
      weapons.push(weapon);
    }
  }
  return weapons
}

function getArmor(size,buildPoints) {
  var armors = []
  for (armor in shipArmor) {
    if ( (shipArmor[armor].BPCostMultiplier * size ) <= buildPoints) {
      armors.push(armor);
    }
  }
  return armors
}

function getComputers(buildPoints,powerCoreUnits) {
  var computers = []
  for (computer in shipComputers) {
    if (shipComputers[computer].cost.BP <= buildPoints && shipComputers[computer].cost.PCU <= powerCoreUnits) {
      computers.push(computer);
    }
  }
  return computers
}

function getShields(buildPoints,powerCoreUnits) {
  var shields = []
  for (shield in shipShields) {
    if (shipShields[shield].cost.BP <= buildPoints && shipShields[shield].cost.PCU <= powerCoreUnits) {
      shields.push(shield);
    }
  }
  return shields
}

function getDefenses(buildPoints,powerCoreUnits) {
  var defenses = []
  for (defense in shipDefenses) {
    if (shipDefenses[defense].cost.BP <= buildPoints && shipDefenses[defense].cost.PCU <= powerCoreUnits) {
      defenses.push(defense);
    }
  }
  return defenses
}

function getDriftEngine(size,buildPoints,power) {
  var engines = []
  for (engine in shipDriftEngines) {
    if ( (shipDriftEngines[engine].BPCostMultiplier * size ) <= buildPoints && size <= shipDriftEngines[engine].maxSize && power >= shipDriftEngines[engine].minPCU) {
      engines.push(engine);
    }
  }
  return engines
}

function getExpansionBays(size,buildPoints,powerCoreUnits,slots) {
  var bays = []
  for (bay in shipExpansionBays) {
    if ( size >= shipExpansionBays[bay].minSize && shipExpansionBays[bay].cost.BP <= buildPoints && shipExpansionBays[bay].cost.PCU <= powerCoreUnits && shipExpansionBays[bay].slots <= slots && bay != "Cargo hold" && bay != "Power core housing") {
      bays.push(bay);
    }
  }
  return bays
}

function getSensors(buildPoints) {
  var sensors = []
  for (sensor in shipSensors) {
    if (shipSensors[sensor].cost.BP <= buildPoints) {
      sensors.push(sensor);
    }
  }
  return sensors
}

//show the summernote edit box wrapped around the statblock text
function editBlock() {
  $('.btn-save').show();
  $('.btn-edit').hide();
  $('.btn-image').hide();
  $('.btn-print').hide();
  $('#overEdit').css({'margin-left': '0em', 'margin-right': '0em'});
  $('.summernoteEdit').summernote({
    focus: true,
    toolbar: [
      // [groupName, [list of button]]
      ['style', ['bold', 'italic', 'underline', 'superscript', 'subscript', 'clear', 'color']],
      ['fontsize', ['fontsize']],
      ['insert', ['link','hr','picture']],
      ['misc', ['fullscreen','codeview',]],
    ],
    print: {
        'stylesheetUrl': 'static/css/print.css'
    }
  });
};

//remove the edit box and show straight html
function saveBlock() {
  $('.btn-save').hide();
  $('.btn-edit').show();
  $('.btn-image').show();
  $('.btn-print').show();
  $('#overEdit').css({'margin-left': '4.5em', 'margin-right': '1em'});
  var markup = $('.summernoteEdit').summernote('code');
  $('.summernoteEdit').summernote('destroy');
};

//generate image from statblock so user can save
function blockToImage() {
  html2canvas(document.querySelector("#capture")).then(canvas => {

    canvas.toBlob(function(blob) {
    	saveAs(blob, "statblock.png");
    });
  });
};

//print the statblock
function printBlock() {
    window.print();
};

//returns a shuffled array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

//runs when page is loaded
$( document ).ready(function() {
  //initialise pickers
  $('.selectpicker').selectpicker();
});