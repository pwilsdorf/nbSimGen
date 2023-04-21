
define([
    'base/js/namespace',
    'base/js/events',
    'notebook/js/codecell',
    'jquery',
    'base/js/dialog'
    ], function(Jupyter, events, codecell,$, dialog) {
        /*Wenn das visualize-flag gesetzt wurde, wird der Codeblock zurückgegeben*/ 
        var visualize = function(cell_content){
            var cell_array = cell_content.split('\n');
            for (var j = 0; j < cell_array.length; j++){
                if(cell_array[j].includes("#@visualize")){
                    
                    return `\nimport numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import griddata
                    \ndef draw_heatmap(output_path,x_label,y_label,title):# Load data from CSV
                    dat = np.genfromtxt(output_path, delimiter=',',skip_header=1)
                    X_dat = dat[:,0]
                    Y_dat = dat[:,1]
                    Z_dat = dat[:,2]
                    font = {'family': 'serif',
                    'color':  'darkred',
                    'weight': 'normal',
                    'size': 16,
                    }        
                    # Convert from pandas dataframes to numpy arrays
                    X, Y, Z, = np.array([]), np.array([]), np.array([])
                    for i in range(len(X_dat)):
                        X = np.append(X, X_dat[i])
                        Y = np.append(Y, Y_dat[i])
                        Z = np.append(Z, Z_dat[i])
                            
                    # create x-y points to be used in heatmap
                    xi = np.linspace(X.min(), X.max(), 1000)
                    yi = np.linspace(Y.min(), Y.max(), 1000)
                            
                    # Interpolate for plotting
                    zi = griddata((X, Y), Z, (xi[None,:], yi[:,None]), method='cubic')
                            
                    # I control the range of my colorbar by removing data 
                    # outside of my range of interest
                    zmin = Z.min()
                    zmax = Z.max()
                    # zi[(zi<zmin) | (zi>zmax)] = None
                            
                    # Create the contour plot
                    CS = plt.contourf(xi, yi, zi, 15, cmap=plt.cm.rainbow,
                                    vmax=zmax, vmin=zmin)
                    plt.xlabel(x_label, fontdict=font)
                    plt.ylabel(y_label, fontdict=font)
                    plt.title(title)
                    plt.colorbar()  
                    plt.show()`
                ;}
            }
            return " ";
        };
        /*Wenn das visualize-flag gesetzt wurde, wird der Codeblock zurückgegeben. Allerdings wird diese Codezeile
        an einer anderen Stelle Stelle angefügt, weshalb es eine zweite Hilfsfunktion gibt.*/
        var visualize2 = function(cell_content){
            var cell_array = cell_content.split('\n');
            for (var j = 0; j < cell_array.length; j++){
                if(cell_array[j].includes("#@visualize")){
                    return `draw_heatmap(output_path,params[0][3],params[1][3],outputs[0])
                    `
                ;}
            }
            return " ";
        };
var convertOptparameterstoString = function(cell_content){
            /* cell_content sammelt alle Zeilen des Notebooks, diese werden dann zuerst in die einzelnen Zeilen aufgesplittet und 
            in ein Array gespeichert*/
            var cell_array = cell_content.split("\n");
            /* Definition von Hilfsvariablen*/
            var annealing = false;
            var maximize = false;
            maxiter_string= String("maxiter=");
            return_string = String(`def transform_list_to_dict(parameters):\n    dict={}\n`); 
            output_string = String("\n");
            value_string = String("");
            bound_string = String("(");
            start_value_string = String("[");
            outputfile_string= String(" ");
            csv_string= String(`\nwith open(output_path, 'w', encoding='UTF8') as f:\n    writer = csv.writer(f, delimiter=",")\n`);
            csv_inside_string= String(`\n        csv_list= list(dict.values())\n        csv_list.append(return_values[0])\n        print("Der Rückgabewert beträgt: "+ str(return_values[0]))\n        writer.writerow(csv_list)`);
            counter = 0;
            for(var i = 0; i < cell_array.length; i++){
                /* Wenn irgendwo im Notebook #@temperature oder #@iterations steht, wird annealing auf wahr gesetzt und der 
                Dual-Annealing-Algorithmus wird generiert.*/
                if(cell_array[i].includes("#@temperature")||cell_array[i].includes("#@iterations")){
                    annealing = true;
                }
                /* Wenn irgendwo im Notebook #@maximize steht, wird maximize auf wahr gesetzt und der
                Zielfunktionswert wird dann maximiert.*/
                if(cell_array[i].includes("#@maximize")){
                    maximize = true;
                }
            }
            /*Stringvariablen werden für den Fall deklariert, dass annaeling auf wahr gesetzt wurde(Weil Dual Annealing 
                generiert werden soll).*/
            if (annealing){
                import_string = String(`from scipy.optimize import dual_annealing\n`);
                population_string= String("initial_temp=");
                iteration_annotate=String("#@iterations");
                temperature_or_population=String("#@temperature");
                function_call=String("dual_annealing");
            }
            /*Stringvariablen werden für den Fall deklariert, dass annaeling falsch bleibt(Weil differentielle Evolution
                generiert werden soll).*/
            else{import_string = String(`from scipy.optimize import differential_evolution\n`);
                 population_string= String("popsize=");
                 iteration_annotate=String("#@generations");
                 temperature_or_population=String("#@population");
                 function_call=String("differential_evolution");
            }
            
            /*Notebookinhalt wird zeilenweise durchsucht*/
            for (var j = 0; j < cell_array.length; j++){
            if(cell_array[j].includes("#@parameter")){
            var help_array = cell_array[j].split("=");
                /*dictionary wird für jeden gefunden Parameter aktualisiert*/
                return_string += '    dict.update({"'+help_array[0]+'":parameters['+counter+']})\n';
                counter++;
                value_string += help_array[1]+"\n";
                }
                /*Ausgabeparameter werden gesucht*/
                if(cell_array[j].includes("#@output_variable")){
                    output_string = "    return_values = run_simulation(dict,['"+ cell_array[j].split("#@output_variable")[0]+"'])"
                }
                /*Ausgabepfad wird gesucht*/
                if(cell_array[j].includes("#@output_file")){
                    outputfile_string = '\noutput_path= ' + cell_array[j].split("#@output_file")[0];
                }
                /*Temperatur oder Population wird gesucht*/
                if(cell_array[j].includes(temperature_or_population)){
                    var help_array2 = cell_array[j].split("#@");
                    population_string += help_array2[0];
                }
                /*Anzahl Iterationen werden gesucht*/
                if(cell_array[j].includes(iteration_annotate)){
                        var help_array3 = cell_array[j].split("#@");
                        maxiter_string += help_array3[0];
                    }
            }
            var value_string_2 = value_string.split(/]|,/);

            for (var j = 0; j < value_string_2.length; j++){
                if (j % 3 == 0){
                /*Inhalt der Parametertripel wird aufgesplittet, da die Intervallgrenzen der Parameter in den Algorithmen an unterschiedlichen
                Stellen stehen*/
                    if(value_string_2[j].includes("#@parameter")){
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
            /* Teilstrings werden abgeschlossen*/
            bound_string=bound_string.slice(0,bound_string.length-2);
            bound_string+=")";
            start_value_string=start_value_string.slice(0,start_value_string.length-1);
            /*Defaultwerte werden gesetzt, sollten keinen Werte gesetzt worden sein*/
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
            /*Soll maximiert oder minimiert werden?*/
            if(maximize){
                returns_string = String("    return -return_values[0]\n");
                print_string = String(`print("Der minimale Zielfunktionswert lautet: "+str(-result.fun))`);
            }
            else {returns_string = String("    return return_values[0]\n");
            print_string = String(`print("Der minimale Zielfunktionswert lautet: "+str(result.fun))`);
        }
        /*String wird zusammengekettet*/
            func_string =String(import_string+outputfile_string+return_string + `    print(dict)\n` + output_string + `\n    print("Der Rückgabewert beträgt: "+ str(return_values[0]))\n`+returns_string+`
                   
            
result =` +function_call+`(transform_list_to_dict,`+bound_string +`,x0=`+start_value_string+`],`+maxiter_string+`,`+population_string+`)
print("Die minimale Parametrisierung lautet: "+str(result.x))\n`+print_string); 
            /*Wenn ein Ausgabepfad gegeben ist, muss im Experimentcode noch mehr eingerückt werden, was im else-Fall passiert*/
            if (outputfile_string === " "){
            return func_string;
            }
            else  {result = return_string.replace(/\n/g, "\n    ");
            return import_string+"import csv"+outputfile_string+csv_string+"    "+result+output_string +csv_inside_string+`\n        print(return_values[0])\n    `+returns_string+`\n\n\n    result =`+function_call+`(transform_list_to_dict,`+bound_string +`,x0=`+start_value_string+`],`+maxiter_string+`,`+population_string+`)\n    print("Die minimale Parametrisierung lautet: "+str(result.x)) \n    `+print_string;}
        };
/*Wird aufgerufen, wenn der Parameterscan ausgewählt wurde und der "Play"-Button gedrückt wurde*/
var parameterscan_button_pressed = function(){
                /*Zelleninhalte werden aneinader gekettet*/
                cells = Jupyter.notebook.get_cells();
                Jupyter.notebook.get_cell(cells.length - 1).select();
                all_cell_content=String(" ");
                for(var i=0; i<cells.length; i++){
                    all_cell_content+=cells[i].get_text();
                    all_cell_content+="\n";
                }
                /*Codezelle mit Experimentcode wird an untersteter Stelle dem Notebook hinzugefügt*/
                Jupyter.notebook.
                insert_cell_below('code').
                set_text(`import csv`
        + visualize(all_cell_content)+`\n`
        + convertInputToList(all_cell_content)+visualize2(all_cell_content)
                            );
        };
/*Wird aufgerufen, wenn die Optimierung ausgewählt wurde und der "Play"-Button gedrückt wurde*/
    var optimize_button_pressed = function () {
        /*Zelleninhalte werden aneinader gekettet*/
        cells = Jupyter.notebook.get_cells();
                Jupyter.notebook.get_cell(cells.length - 1).select();
                all_cell_content=String(" ");
                for(var i=0; i<cells.length; i++){
                    if ((cells[i] instanceof codecell.CodeCell === true)) {
                    all_cell_content+=cells[i].get_text();
                    all_cell_content+="\n";
                    }
                }
                /*Codezelle mit Experimentcode wird an untersteter Stelle dem Notebook hinzugefügt*/
                Jupyter.notebook.
                insert_cell_below('code').set_text(
    convertOptparameterstoString(all_cell_content));
    };

    var initialize = function () {
        /*initialisiert die Toolbar zur Auswahl des Experimenttyps*/
        var dropdown = $("<select></select>").attr("id", "option_picker")
                                             .css("margin-left", "0.5em")
                                             .attr("class", "form-control select-xs")
                                             .change();
        Jupyter.toolbar.element.append(dropdown);
    };
/*Wird aufgerufen wenn der "Play"-Button gedrückt wurde*/
var pressed = function(){
    /*Es wird überprüft, welche Option in der Toolbar ausgewählt wurde*/
    var selected_snippet = $("select#option_picker").find(":selected");
    if (selected_snippet.attr('code') === 'Optimization'){
        optimize_button_pressed();
    }
    else if (selected_snippet.attr('code') === 'Parameter Scan'){
        parameterscan_button_pressed();
    }
}
/*Verarbeitet den Ausgabepfad aus der Nutzereingabe*/
function convertInputToOutput(cell_content){
    var cell_array = cell_content.split("\n");
    for(var j = 0; j< cell_array.length; j++){
        if(cell_array[j].includes("#@output_file")){
            output_path=String(cell_array[j].split("#@output_file"));
            outputfile_string = String('\noutput_path= ' + cell_array[j].split("#@output_file")[0]);
        }
    }
    return outputfile_string;
}
/*Verarbeitet Ausnahmen aus der Nutzereingabe*/
function convertInputToException(cell_content){
    var cell_array = cell_content.split("\n");
    ausnahmestring = String("if(not(");
    for(var j = 0; j< cell_array.length; j++){
        if(cell_array[j].includes("#@exception")){
            ausnahme_part_string=String(cell_array[j].split("#@exception")[0]);
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
    if(ausnahmestring != "if(not("){
        ausnahmestring=ausnahmestring.slice(0,ausnahmestring.length-4);
        ausnahmestring += ")):";}
        /*Wenn keine Ausnahme deklariert wurde, wird der String auf if(True) gesetzt*/
        else{ausnahmestring = "if(True):"}
    return ausnahmestring;
}
function convertInputToList(cell_content){
    var cell_array = cell_content.split("\n");
    /*Wenn #@number_of_sample_points deklariert wurde, dann wird Latin Hypercube generiert*/
    if(!(cell_content.includes("#@number_of_sample_points"))){
    /*Einige Hilfsvariablen werden für den full factorial Parameterscan definiert*/
    parameterstring = String("params = [");
    outputparameterstring = String("outputs = [");
    ausnahmestring = String("                        if(not(");
    for (var j = 0; j < cell_array.length; j++){
        /*Es wird nach Eingabeparametern gesucht*/
        if(cell_array[j].includes("#@parameter")){
    for (var i = 0; i < cell_array[j].length; i++) {
        if (cell_array[j].charAt(i)==='['){
                parameterstring += "[";
                while(cell_array[j].charAt(i+1)!= ']'){
                    parameterstring += cell_array[j].charAt(i+1);
                    i++;
                }
        }
        else if (cell_array[j].charAt(i)=== "]"){
            var param_name = cell_array[j].split("=");
            parameterstring += ",\'";
            parameterstring += param_name[0];
            parameterstring += "\'],";
        }
        }
    }
        /*Es wird nach Ausgabepfaden gesucht*/
        if(cell_array[j].includes("#@output_file")){
            output_path=String(cell_array[j].split("#@output_file"));
            outputfile_string = String('\noutput_path= ' + cell_array[j].split("#@output_file")[0]);
        }
        /*Es wird nach Ausgabeparametern gesucht*/
        if(cell_array[j].includes("#@output_variable")){
            outputparameterstring+="\'";
            outputparameterstring+= cell_array[j].split("#@output_variable")[0];
            outputparameterstring+="\'";
            outputparameterstring+=', ';
        }
}       
        /*Hilfsstrings werden abgeschlossen und aneinander gekettet*/
        parameterstring=parameterstring.slice(0,parameterstring.length-1);
        outputparameterstring=outputparameterstring.slice(0,outputparameterstring.length-2);
        parameterstring += "]";
        parameterstring += convertInputToOutput(all_cell_content);
        outputparameterstring += ']\n';
        outputparameterstring += parameterstring;
        /*String wird zurückgegeben*/
        return outputparameterstring + `\n
        
        
with open(output_path, 'w', encoding='UTF8') as f:
        writer = csv.writer(f, delimiter=",")
        iteration = 0
        params2=[]
        params_dictionary={}
        for i in range(0,len(params)):
            params_dictionary.update({params[i][3]:''})
            params2.append(params[i][0])
        pointer=0
        csv_list=list(params_dictionary.keys())+outputs
        writer.writerow(csv_list)
        while True:
                for l in range(0,len(params)):
                    if params2[l] > params[l][1]:
                        break
                    if l == len(params)-1:
                        iteration += 1
                        print(f'{iteration}, {params2}')
                        for m in range(0,len(params2)):
                            params_dictionary[params[m][3]]= params2[m]
                        print(params_dictionary)\n
                        `+convertInputToException(all_cell_content)+`    
                            csv_list= params2+run_simulation(params_dictionary,outputs)
                        writer.writerow(csv_list)
                if params2[pointer]<params[pointer][1]+params[pointer][2]:
                    pointer = 0
                else:
                    for i in range(0,pointer+1):
                        params2[i]=params[i][0]
                    pointer += 1
                if pointer>len(params)-1:
                    break
                params2[pointer]+=params[pointer][2]
        f.close()
        `;}
else{
    /*Wenn Latin Hypercube gesampelt werden soll*/
    output_string=String(`from scipy.stats import qmc\n
params_dictionary={}\n
iteration=0\n`
+ convertInputToOutput(all_cell_content) +
`\nwith open(output_path, 'w', encoding='UTF8') as f:
    writer = csv.writer(f, delimiter=",")\n`)
sampler_string=String(`    sampler = qmc.LatinHypercube(d=`);
    var counter = 0;
    outputparameterstring = String(`    outputs=[`)
    qmc_string=String(`    parameterarray=qmc.scale(sample,l_bounds,u_bounds)
    for i in range(0,len(parameterarray)):
        for j in range(0,len(parameterarray[i])):
            params_dictionary.update([(list(params_dictionary)[j],parameterarray[i][j])])
        iteration+=1
        print(f'{iteration}, {params_dictionary}')
        `
    +convertInputToException(all_cell_content)+`
            csv_list= list(params_dictionary.values())+run_simulation(params_dictionary,outputs)
            writer.writerow(csv_list)`);
    l_bound_string=String(`    l_bounds=[`);
    u_bound_string=String(`    u_bounds=[`);
    sample_size_string=String(`5`);
        for(var l = 0; l< cell_array.length; l++){
            if(cell_array[l].includes("#@parameter")){
                /*Es wird nach Eingabeparametern gesucht, allerdings müssen diese anders verkettet werden als beim 
                Full Factorial Parameterscan*/
                    var param_name = cell_array[l].split(/=|,|\[|\]|#@/);
                    output_string +=`    params_dictionary.update({'`+param_name[0]+`':''})\n`;
                    l_bound_string += param_name[2]+`,`;
                    u_bound_string += param_name[3]+`,`;
                    counter += 1;
                }
                /*Es wird nach Ausgabeparametern gesucht*/
                if(cell_array[l].includes("#@output_variable")){
                    outputparameterstring+="\'";
                    outputparameterstring+= cell_array[l].split("#@output_variable")[0];
                    outputparameterstring+="\'";
                    outputparameterstring+=', ';
                }
            /*Es wird nach der Anzahl der Punkte gesucht*/
            if(cell_array[l].includes("#@number_of_sample_points")){
                sample_size_string = cell_array[l].split(/#@/)[0];
            }
            }
            /*Hilfsstrings werden abgeschlossen und aneinander gekettet*/
            sampler_string += String(counter)+`)
    sample = sampler.random(n=`+sample_size_string+`)\n`;
            outputparameterstring=outputparameterstring.slice(0,outputparameterstring.length-2);
            outputparameterstring+=`]\n`;
            l_bound_string=l_bound_string.slice(0,l_bound_string.length-1);
            u_bound_string=u_bound_string.slice(0,u_bound_string.length-1);
            l_bound_string+= `]\n`;
            u_bound_string+= `]\n`;
            output_string += outputparameterstring + `    csv_list=list(params_dictionary.keys())+outputs\n    writer.writerow(csv_list)\n` +sampler_string + l_bound_string + u_bound_string + qmc_string+`\nf.close()`;
            return output_string;
}
    }
/*Hilfsseite wird definiert*/
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
    /* Fügt die erste Option zur Toolbar hinzu, bei der nichts passiert wenn sie gedrückt wird*/
    var option = $("<option></option>")
                 .attr("id", "option_header")
                 .text("Select Experiment Type");
    $("select#option_picker").append(option);

    // Fügt Optionen aus der options.json hinzu
    $.each(data['options'], function(key, snippet) {
        var option = $("<option></option>")
                     .attr("value", snippet['name'])
                     .text(snippet['name'])
                     .attr("code", snippet['code'].join('\n'));
        $("select#option_picker").append(option);
    });
})
.error(function(jqXHR, textStatus, errorThrown) {
    /* Gibt Fehlermeldung zurück, wenn die otions.json nicht geladen werden kann*/
    var option = $("<option></option>")
                 .attr("value", 'ERROR')
                 .text('Error: failed to load snippets!')
                 .attr("code", "");
    $("select#option_picker").append(option);
});



};
    /* Wird aufgerufen, wenn ein Notebook gestartet wird und die Extension aktiv ist*/
    function load_ipython_extension() {
        Jupyter.notebook.config.loaded.then(initialize);
        cells = Jupyter.notebook.get_cells()
        addButtons();
        
    }
    return {
        load_ipython_extension: load_ipython_extension
    };
});