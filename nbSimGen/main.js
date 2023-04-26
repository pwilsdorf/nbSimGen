
define([
    'base/js/namespace',
    'base/js/events',
    'notebook/js/codecell',
    'jquery',
    'base/js/dialog'
    ], function(Jupyter, events, codecell,$, dialog) {
/*Build code for an optimization experiment.*/
var convertOptparameterstoString = function(cell_content){
            /* cell_content collects all cells of the Notebook. 
            Those are then split into lines and stored as an array.*/
            var cell_array = cell_content.split("\n");
            /* Definition of auxiliary variables*/
            var annealing = false;
            var maximize = false;
            maxiter_string= String("maxiter=");
            return_string = String(`def transform_list_to_dict(parameters):\n    dict={}\n`); 
            output_string = String("\n");
            value_string = String("");
            bound_string = String("(");
            start_value_string = String("[");
            outputfile_string= String(" ");
            csv_string= String(`\nwith open(output_file, 'w', encoding='UTF8') as f:\n    writer = csv.writer(f, delimiter=",")\n`);
            csv_inside_string= String(`\n        csv_list= list(dict.values())\n        csv_list.append(return_values[0])\n        print("The return value is: "+ str(return_values[0]))\n        writer.writerow(csv_list)`);
            counter = 0;
            for(var i = 0; i < cell_array.length; i++){
                /* If somewhere in the Notebook the terms @temperature oder @iterations are found, annealing is set 
                to true and the Dual Annealing algorithm is generated.*/
                if(cell_array[i].includes("@temperature")||cell_array[i].includes("@iterations")){
                    annealing = true;
                }
                /* If somewhere in the Notebook the term @maximize is found, maximize is set to true and
                the value of the objective function is maximized.*/
                if(cell_array[i].includes("@maximize")){
                    maximize = true;
                }
            }
            /*String variables are declared for the case that annealing is true (generate dual annealing).*/
            if (annealing){
                import_string = String(`from scipy.optimize import dual_annealing\n`);
                population_string= String("initial_temp=");
                iteration_annotate=String("@iterations");
                temperature_or_population=String("@temperature");
                function_call=String("dual_annealing");
            }
            /*String variables are declared for the case that annealing remained false (generate differential evolution).*/
            else{import_string = String(`from scipy.optimize import differential_evolution\n`);
                 population_string= String("popsize=");
                 iteration_annotate=String("@generations");
                 temperature_or_population=String("@population");
                 function_call=String("differential_evolution");
            }
            
            /*Content of the notebook is evaluated row by row*/
            for (var j = 0; j < cell_array.length; j++){
                /*Look for parameter*/
                if(cell_array[j].includes("@parameter")){
                    var help_array = cell_array[j].split("=");
                    /*Dictionary is updated for each found parameter*/
                    return_string += '    dict.update({"'+help_array[0]+'":parameters['+counter+']})\n';
                    counter++;
                    value_string += help_array[1]+"\n";
                }
                /*Look for output variables*/
                if(cell_array[j].includes("@output_variable")){
                    output_string = "    return_values = run_simulation(dict,['"+ cell_array[j].split("@output_variable")[0]+"'])"
                }
                /*Look for output file*/
                if(cell_array[j].includes("@output_file")){
                    outputfile_string = '\noutput_file= ' + cell_array[j].split("@output_file")[0];
                }
                /*Look for temperature or population*/
                if(cell_array[j].includes(temperature_or_population)){
                    var help_array2 = cell_array[j].split("@");
                    population_string += help_array2[0];
                }
                /*Look for number of iterations*/
                if(cell_array[j].includes(iteration_annotate)){
                        var help_array3 = cell_array[j].split("@");
                        maxiter_string += help_array3[0];
                    }
            }
            var value_string_2 = value_string.split(/]|,/);

            for (var j = 0; j < value_string_2.length; j++){
                if (j % 3 == 0){
                /*Content of the parameter triple is splitted, to get the parameter bounds.*/
                    if(value_string_2[j].includes("@parameter")){
                        value_string.slice(1,value_string_2[j].length);
                    bound_string+="("+value_string_2[j].split("\n")[1];
                    }
                    else bound_string +="("+ value_string_2[j];
                }
                else if(j % 3 == 1){
                    bound_string+=","+value_string_2[j]+")";
                }
                else if (j % 3 == 2){
                    bound_string+=",";
                    start_value_string+=value_string_2[j]+","
                }
            }
            while(bound_string.includes("[")){
            bound_string = bound_string.replace('([','(');
            }
            /*Close strings*/
            bound_string=bound_string.slice(0,bound_string.length-2);
            bound_string+=")";
            start_value_string=start_value_string.slice(0,start_value_string.length-1);
            /*Set default values if optional annotations have not been found.*/
            if (population_string === "popsize="){
                population_string = "popsize=3";
            }
            else if(population_string === "initial_temp="){
                population_string = "initial_temp=5230";
            }
            if (maxiter_string === "maxiter="){
                if(annealing){ maxiter_string="maxiter=1000";}
                else maxiter_string = "maxiter=1";
            }
            /*Template strings for maximize or minimize, respectively*/
            if(maximize){
                returns_string = String("    return -return_values[0]\n");
                print_string = String(`print("The minimal value of the objective function is: "+str(-result.fun))`);
            }
            else {returns_string = String("    return return_values[0]\n");
            print_string = String(`print("The minimal value of the objective function is: "+str(result.fun))`);
        }
        /*Concatenate string*/
            func_string =String(import_string+outputfile_string+return_string + `    print(dict)\n` + output_string + `\n    print("The return value is: "+ str(return_values[0]))\n`+returns_string+`
                   
            
result =` +function_call+`(transform_list_to_dict,`+bound_string +`,x0=`+start_value_string+`],`+maxiter_string+`,`+population_string+`)
print("The minimal parametrization is: "+str(result.x))\n`+print_string); 
            /*If an output path is given, the string needs to be indented more, see else branch*/
            if (outputfile_string === " "){
            return func_string;
            }
            else  {result = return_string.replace(/\n/g, "\n    ");
            return import_string+"import csv\n"+outputfile_string+csv_string+"    "+result+output_string +csv_inside_string+`\n        print(return_values[0])\n    `+returns_string+`\n\n\n    result =`+function_call+`(transform_list_to_dict,`+bound_string +`,x0=`+start_value_string+`],`+maxiter_string+`,`+population_string+`)\n    print("The minimal parametrization is: "+str(result.x)) \n    `+print_string;}
        };
/*Call this function is a parameter scan was selected and the play button was pressed.*/
var parameterscan_button_pressed = function(){
                /*Contents of the notebook cells are concatenated*/
                cells = Jupyter.notebook.get_cells();
                Jupyter.notebook.get_cell(cells.length - 1).select();
                all_cell_content=String(" ");
                for(var i=0; i<cells.length; i++){
                    all_cell_content+=cells[i].get_text();
                    all_cell_content+="\n";
                }
                /*Code cell with experiment code is generated and inserted at the bottom of the notebook*/
                Jupyter.notebook.
                insert_cell_below('code').
                set_text(`import csv\n`
                        + convertInputToList(all_cell_content)
                        );
        };
/*Call this function is an optimization experiment was selected and the play button was pressed.*/
    var optimize_button_pressed = function () {
        /*Contents of the cells are concatenated*/
        cells = Jupyter.notebook.get_cells();
                Jupyter.notebook.get_cell(cells.length - 1).select();
                all_cell_content=String(" ");
                for(var i=0; i<cells.length; i++){
                    if ((cells[i] instanceof codecell.CodeCell === true)) {
                    all_cell_content+=cells[i].get_text();
                    all_cell_content+="\n";
                    }
                }
                /*Code cell with experiment code is inserted at the botton of the notebook.*/
                Jupyter.notebook.
                insert_cell_below('code').set_text(
    convertOptparameterstoString(all_cell_content));
    };

    var initialize = function () {
        /*initialize the toolbar for selecting the experiment type.*/
        var dropdown = $("<select></select>").attr("id", "option_picker")
                                             .css("margin-left", "0.5em")
                                             .attr("class", "form-control select-xs")
                                             .change();
        Jupyter.toolbar.element.append(dropdown);
    };
/*Is called when the "Play"-Button is pressed.*/
var pressed = function(){
    /*Check which option was selected in the toolbar.*/
    var selected_snippet = $("select#option_picker").find(":selected");
    if (selected_snippet.attr('code') === 'Optimization'){
        optimize_button_pressed();
    }
    else if (selected_snippet.attr('code') === 'Parameter Scan'){
        parameterscan_button_pressed();
    }
}
/*Process the output path found in the user input.*/
function convertInputToOutput(cell_content){
    var cell_array = cell_content.split("\n");
    for(var j = 0; j< cell_array.length; j++){
        if(cell_array[j].includes("@output_file")){
            output_file=String(cell_array[j].split("@output_file"));
            outputfile_string = String('\noutput_file= ' + cell_array[j].split("@output_file")[0]);
        }
    }
    return outputfile_string;
}
/*Process exceptions found in the user input.*/
function convertInputToException(cell_content){
    var cell_array = cell_content.split("\n");
    ausnahmestring = String("        if(");
    for(var j = 0; j< cell_array.length; j++){
        if(cell_array[j].includes("@exception")){
            ausnahme_part_string=String(cell_array[j].split("@exception")[0]);
            var ausnahme_part_string_values=ausnahme_part_string.split(/\"|\'/);
            for(var i=0; i<ausnahme_part_string_values.length; i++){
                if(i%2==1){
                    ausnahmestring += `params_dictionary.get('`+ausnahme_part_string_values[i]+`')`;
                }
                else ausnahmestring += ausnahme_part_string_values[i];
            }
            ausnahmestring += ` or `;

        }
    }
    if(ausnahmestring != "        if("){
        ausnahmestring=ausnahmestring.slice(0,ausnahmestring.length-4);
        ausnahmestring += "):\n            continue\n";
    }
    /*If no exceptions were declared, use empty string*/
    else{ausnahmestring = ""}
    return ausnahmestring;
}
function convertInputToList(cell_content){
    var cell_array = cell_content.split("\n");
    /*If the number of sample points was not declared, a full factorial experiment will be generated.*/
    if(!(cell_content.includes("@number_of_sample_points"))){
    /*Some auxiliary variables for the full factorial parameter scan*/
    parameterstring = String("");
    xstring = String("");
    parameterdictionarystring = String("");
    outputvariablestring = String("outputs = [");
    ausnahmestring = String("                        if(not(");
    /*Go through cells from from last to first and find parameters - but do not use them twice*/
    const param_list=[]
    const output_list=[]
    counter=1
    for(var j = cell_array.length - 1; j >= 0; j--){
        /*Look for input parameters*/
        if(cell_array[j].includes("@parameter")){
            var param = cell_array[j].split(/=|,|\[|\]|@/);
            param_name = param[0].trim();
            /*If the same parameter was found before (re-declared)*/
            if(!param_list.includes(param_name)){
                /*Get the values of the lower, upper bound, and interval*/
                l_bound = param[2].trim();
                u_bound = param[3].trim();
                interval = param[4].trim();
                parameterstring += `X` + counter + ` = list(np.arange(` + l_bound + `, ` + u_bound + ` + ` + interval + `, ` + interval + `))\n`;
                xstring += `X` + counter + `, `;
                parameterdictionarystring += `        params_dictionary.update({\'` + param_name + `\': point\[` + (counter-1) + `\]})\n`;
                param_list.push(param_name);
                counter++;
            }
        }
        /*Look for output paths*/
        if(cell_array[j].includes("@output_file")){
            output_file=String(cell_array[j].split("@output_file"));
            outputfile_string = String('output_file = ' + cell_array[j].split("@output_file")[0] + `\n`);
        }
        /*Look for output variables*/
        if(cell_array[j].includes("@output_variable")){
            output_name = cell_array[j].split("@output_variable")[0];
            /*Do not use the same output twice */
            if(!output_list.includes(output_name)){
                outputvariablestring+="\'";
                outputvariablestring+= output_name;
                outputvariablestring+="\'";
                outputvariablestring+=', ';
                output_list.push(output_name);
            }
        }
    }     
    /*Close auxiliary strings and concatenate them*/
    outputvariablestring=outputvariablestring.slice(0,outputvariablestring.length-2);
    outputvariablestring += ']\n';
    xstring = xstring.slice(0,xstring.length-2); //remove trailing comma
    /*Return string*/
    return `import itertools\nimport numpy as np\n\n` +
    outputfile_string +
    outputvariablestring + 
    parameterstring + 
`params_dictionary = {} 
iteration = 0
with open(output_file, 'w', encoding='UTF8') as f:
    writer = csv.writer(f, delimiter=",")
    csv_list = list(params_dictionary.keys()) + outputs
    writer.writerow(csv_list)
    design = itertools.product(` + xstring + `)
    for point in design:\n` +
        parameterdictionarystring +
`        iteration += 1\n` +
        convertInputToException(all_cell_content)+`
        print(f'{iteration}, {params_dictionary}')
        csv_list = list(params_dictionary.values()) + run_simulation(params_dictionary, outputs)
        writer.writerow(csv_list)
f.close()
        `;}
    else{
        /*If a Latin hypercube shall be used for sampling*/
        output_string=String(`from scipy.stats import qmc\n
params_dictionary={}
iteration=0`
+ convertInputToOutput(all_cell_content) +
`\nwith open(output_file, 'w', encoding='UTF8') as f:
    writer = csv.writer(f, delimiter=",")\n`)
    sampler_string=String(`    sampler = qmc.LatinHypercube(d=`);
    var counter = 0;
    outputvariablestring = String(`    outputs=[`)
    qmc_string=String(`    parameterarray=qmc.scale(sample,l_bounds,u_bounds)
    for i in range(0,len(parameterarray)):
        for j in range(0,len(parameterarray[i])):
            params_dictionary.update([(list(params_dictionary)[j],parameterarray[i][j])])
        iteration+=1\n`
    +convertInputToException(all_cell_content)+
`        print(f'{iteration}, {params_dictionary}')
        csv_list= list(params_dictionary.values())+run_simulation(params_dictionary,outputs)
        writer.writerow(csv_list)`);
    l_bound_string=String(`    l_bounds=[`);
    u_bound_string=String(`    u_bounds=[`);
    var l_aux_string=String(``);
    var u_aux_string=String(``);
    sample_size_string=String(`5`);
        /*Go through cells from from last to first and find parameters - but do not use them twice*/
        const param_list=[]
        const output_list=[]
        for(var l = cell_array.length - 1; l >= 0; l--){
            if(cell_array[l].includes("@parameter")){
                /*Look for input parameters*/
                var param_name = cell_array[l].split(/=|,|\[|\]|@/);
                /*If the same parameter was found before (re-declared)*/
                if(!param_list.includes(param_name[0])){
                    output_string +=`    params_dictionary.update({'`+param_name[0]+`':''})\n`;
                    /*Concatenate info to front of auxiliary strings to retain order of parameters*/
                    l_aux_string = `,` + param_name[2].trim() + l_aux_string;
                    u_aux_string = `,` + param_name[3].trim() + u_aux_string;
                    counter += 1;
                    param_list.push(param_name[0]);
                }
            }
            /*Look for output variables and add them if not found before*/
            if(cell_array[l].includes("@output_variable")){
                var output_name=cell_array[l].split("@output_variable")[0]
                if(!output_list.includes(output_name)){
                    outputvariablestring+="\'";
                    outputvariablestring+= output_name;
                    outputvariablestring+="\'";
                    outputvariablestring+=', ';
                    output_list.push(output_name)
                }
            }
            /*Look for number of sample points*/
            if(cell_array[l].includes("@number_of_sample_points")){
                sample_size_string = cell_array[l].split(/@/)[0];
            }
        }
        /*Close auxiliary strings and concatenate them*/
        sampler_string += String(counter)+`)
    sample = sampler.random(n=`+sample_size_string.trim()+`)\n`;
        outputvariablestring=outputvariablestring.slice(0,outputvariablestring.length-2);
        outputvariablestring+=`]\n`;
        l_bound_string+=l_aux_string.slice(1,l_aux_string.length);
        u_bound_string+=u_aux_string.slice(1,u_aux_string.length);
        l_bound_string+= `]\n`;
        u_bound_string+= `]\n`;
        output_string += outputvariablestring + `    csv_list=list(params_dictionary.keys())+outputs\n    writer.writerow(csv_list)\n` +sampler_string + l_bound_string + u_bound_string + qmc_string+`\nf.close()`;
        return output_string;
}
}

/*Define the help page*/
function createHelpIFrame() {
        var help_iframe = $('<iframe />')
          .attr({
              src: Jupyter.notebook.base_url+"nbextensions/nbSimGen/help.html",
              style: "width: 100%; height: 100%; border: none;"
          });
    
        $("#help-div").append(help_iframe);
    }
      
      // Button to add default cell
var addButtons = function () {  
    /*Buttons werden definiert*/
    Jupyter.toolbar.add_buttons_group([
        Jupyter.keyboard_manager.actions.register ({
          'help': 'Generate Simulation Experiment',
          'icon' : 'fa-play-circle',
          'handler': pressed,
      }, 'do_generation', 'generation'),
//      Jupyter.keyboard_manager.actions.register ({
//        'help': 'Generate Simulation Experiment + Visualization',
//        'icon' : 'fa-play-circle-o',
//        'handler': pressed,
//      }, 'do_generation_with_vis', 'generation_with_vis'),
      {        id: "help-button",        
               label: "Help",        
               icon: "fa-question-circle",        
               callback: function() {          
               if ($("#help-div").is(":visible")) { 
                           $("#help-div").hide();          } 
                else {            createHelpIFrame();            
                    $("#help-div").show();          }
                }}
      ]
      );
      $("body").append("<div id='help-div' style='position: fixed; right: 0; top: 50px; bottom: 0; width: 30%; background-color: white; display: none;'></div>");
    
    $.getJSON(Jupyter.notebook.base_url+"nbextensions/nbSimGen/options.json", function(data) {
    /* Add the first option to the toolbar menu, where nothing happens when pressed*/
    var option = $("<option></option>")
                 .attr("id", "option_header")
                 .text("Select Experiment Type");
    $("select#option_picker").append(option);

    // Add the different experiment types to options.json
    $.each(data['options'], function(key, snippet) {
        var option = $("<option></option>")
                     .attr("value", snippet['name'])
                     .text(snippet['name'])
                     .attr("code", snippet['code'].join('\n'));
        $("select#option_picker").append(option);
    });
})
.error(function(jqXHR, textStatus, errorThrown) {
    /* Throw an error, when the file otions.json cannot be loaded*/
    var option = $("<option></option>")
                 .attr("value", 'ERROR')
                 .text('Error: failed to load snippets!')
                 .attr("code", "");
    $("select#option_picker").append(option);
});



};
    /* Is callen when the notebook is started and the extension is active*/
    function load_ipython_extension() {
        Jupyter.notebook.config.loaded.then(initialize);
        cells = Jupyter.notebook.get_cells()
        addButtons();
        
    }
    return {
        load_ipython_extension: load_ipython_extension
    };
});