# nbSimGen - Jupyter Notebook Extension for Generating Simulation Experiments

## Introduction

Simulation experiments are crucial in conducting simulation studies. With simulation studies growing increasingly complex, simulation experiments are intertwined with steps of conceptual modeling, model building, analyzing data, and visualizing and interpreting results. Making the products of these various steps (assumptions, requirements, data, model components, and experiments) explicit has been shown to increase the reproducibility of simulation studies. Moreover, using an integrated environment that allows developing, organizing and documenting those products can facilitate their automatic reuse and exploitation. We explore Jupyter Notebook as an all-in-one solution for conducting and documenting a simulation study, and we present nbSimGen. This Jupyter Notebook extension lends support to modelers by automatically specifying and running suitable simulation experiments. It is based on an annotation vocabulary that, during the development of the conceptual model and the simulation model, allows users to mark portions of their notebook deemed relevant to the various simulation experiments to come.

## Installation

To get the extension working, the `nbSimGen` folder must be saved to the `nbextensions` directory of your Jupyter installation.
Via the commands `jupyter contrib nbextensions install` and `jupyter nbextension enable nbSimGen/main` in the command line, the extension can be installed and activated.

## User Interface

The extension adds three more elements to the toolbar of Jupyter Notebook.

* Drop-down menu for choosing for the experiment type
* Play button for generating the code of the selected simulation experiment
* Help and Documentation

## Annotations

Annotation vocabulary and the various experiment types, methods, and libraries they refer to.
An annotation always starts with `@`.
If the annotation is part of a code cell, it needs to be placed inside a line comment, i.e., after `#`.
In the following, all annotations are shown for the case of Markdown cells.

## Experiment Type: Parameter Scan

During a parameter scan, configurations are assigned to the input parameters using different systematics. 
The extension offers the following possibilities for a parameter scan:

### Full Factorial

| Term  |  Example |  Description |
|---|---|---|
|  @parameter | a=[1.0, 2.0, 0.1] @parameter  |  Specification of a model parameter for a full factorial scan. Requires a parameter name and a triple consisting of a lower bound and upper bound on the parameter values as well as a stepsize used for sampling between these bounds. At least one parameter needs to be annotated. |
| @output_variable  | exampleOutput @output_variable  |  Name of the desired output variable. Multiple output variables may be annotated. |
|  @output_file |  'examplePath.csv' @output_file | Path to a file where the results of the simulation experiment will be recorded.  |
|  @exception |  'a' * 'b' $\leq$ 50 @exception |  Parameter configurations that shall not be considered in the experiment. Specified as a boolean expression about parameters. Arbitrary many exceptions may be declared.  |

Library used: https://docs.python.org/3/library/itertools.html#itertools.product

### Latin Hypercube

| Term  |  Example |  Description |
|---|---|---|
|  @parameter | a=[1.0, 2.0] @parameter  |  Parameter specification for a Latin hypercube design. Only lower and upper bound are required. |
| @output_variable  | exampleOutput @output_variable  |  see Full Factorial |
|  @output_file |  'examplePath.csv' @output_file | see Full Factorial  |
|  @exception |  'a' * 'b' $\leq$ 50 @exception | see Full Factorial  |
|  @number_of_sample_points | 100 @number_of_sample_points  | Number of samples to be used in a Latin hypercube design.  |

Library used: https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.qmc.LatinHypercube.html

## Experiment Type: Optimization

In an optimization, a desired objective function value is minimized or maximized by changing the configuration of the input parameters. 
The extension offers the following possibilities for an optimization experiment:

### Differential Evolution

| Term  | Example  | Description  |
|---|---|---|
| @parameter  | a=[2,4,3] @parameter  | Specification of a model parameter. Requires a parameter name and a triple consisting of a lower bound and upper bound on the parameter values as well as an inital value for starting the optimization. At least one parameter needs to be annotated.  |
| @output_variable  | sheepCount @output_variable  |  Name of the desired output variable or objective function. |
| @output_file  | 'myProject/results.csv' @output_file  |  Path to a file where the results of the simulation experiment will be recorded. |
| @population  | 20 @population  | Size of the population. Default value = 3.  |
| @generations  | 5 @generations  | Maximum number of generations. Default value = 1.  |

Library used: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.differential_evolution.html

### Dual Annealing

| Term  | Example  | Description  |
|---|---|---|
| @parameter  | a=[2,4,3] @parameter  |  see Differential Evolution |
| @output_variable  | sheepCount @output_variable  | see Differential Evolution  |
| @output_file  | 'myProject/results.csv' @output_file  | see Differential Evolution  |
| @temperature | 4000 @temperature | Initial temperature. Default value = 5230.  |
| @iterations  | 100 @iterations  | Number of iterations. Default value = 1000.  |

Library used: https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.dual_annealing.html


## References
