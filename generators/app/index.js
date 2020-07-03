/* eslint-disable */
"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");

module.exports = class extends Generator {
  async prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(
        `Welcome to the prime ${chalk.cyan("Carmuv React Toolkit")} generator!`
      )
    );

    const propsPrompt = [
      {
        type: "input",
        name: "name",
        message: "Enter the name of the property:"
      },
      {
        type: "input",
        name: "title",
        message: "Enter the title of the property:",
        default: function(answers) {
          return (
            answers.name.substr(0, 1).toUpperCase() + answers.name.substr(1)
          );
        }
      },
      {
        type: "list",
        name: "type",
        choices: [
          "array",
          "bool",
          "func",
          "number",
          "object",
          "string",
          "symbol",
          "any",
          "arrayOf",
          "element",
          "elementType",
          "instanceOf",
          "node",
          "objectOf",
          "oneOf",
          "oneOfType",
          "shape",
          "exact"
        ],
        message: "Select type of the property:",
        default: "string"
      },
      {
        type: "text",
        name: "defaultValue",
        message: "enter default value",
      },
      {
        type: "confirm",
        name: "addAnother",
        message: "Add another property?",
        default: true
      }
    ];
    const mutationPrompt = [
      {
        name: "mutationEntity",
        message: "Please enter your entity name:"
      },
      {
        name: "inputEntityName",
        message: "Please enter your input entity name:",
        default: function(answers) {
          return answers.mutationEntity;
        }
      },
      {
        name: "mutationName",
        message: "Enter the mutation name:",
        default: function(answers) {
          return `SET_${answers.mutationEntity.toUpperCase()}`;
        }
      }
    ];
    const queryPrompt = [
      {
        name: "queryEntity",
        message: "Please enter your entity name:"
      },
      {
        name: "queryName",
        message: "Enter the query name:",
        default: function(answers) {
          return `GET_${answers.queryEntity.toUpperCase()}S`;
        }
      }
    ];
    const promptForProps = async props => {
      const { addAnother, ...property } = await this.prompt(propsPrompt);
      props.push(property);
      if (addAnother) {
        return await promptForProps(props);
      }

      return props;
    };

    const getProperties = async () => {
      const props = await promptForProps([]);
      return props;
    };

    const createQuery = async () => {
      const query = await this.prompt(queryPrompt);
      return query;
    };

    const createMutation = async () => {
      const mutation = await this.prompt(mutationPrompt);
      return mutation;
    };

    const createComponent = async () => {
      const prompts = [
        {
          name: "type",
          type: "list",
          message: "What do you want to generate?",
          choices: ["Component"],
          default: "Component",
          cache: true
        },
        {
          name: "name",
          message: "Enter a name for your component:",
          cache: true
        },
        {
          type: "confirm",
          name: "useStyles",
          message: "Does you want to use styles?",
          default: function(answers) {
            return answers.type === "Component";
          },
          cache: true
        },
        {
          type: "confirm",
          name: "addQuery",
          message: "Does your component use a Query?",
          default: function(answers) {
            return answers.type === "Container";
          },
          cache: true
        },
        ...queryPrompt.map(query => ({
          ...query,
          when: function(answers) {
            return answers.addQuery;
          }
        })),
        {
          type: "confirm",
          name: "addMutation",
          message: "Does your component use a Mutation?",
          default: function(answers) {
            return answers.type === "Container";
          },
          cache: true
        },
        ...mutationPrompt.map(mutation => ({
          ...mutation,
          when: function(answers) {
            return answers.addMutation;
          }
        })),
        {
          type: "confirm",
          name: "useState",
          message: "Does your component use State?",
          default: function(answers) {
            return answers.type === "Container";
          },
          cache: true
        }
      ];

      const answers = await this.prompt(prompts);
      if (answers.useState) {
        const stateProps = await getProperties();
        answers.stateProps = stateProps;
      }

      const { hasProps } = await this.prompt({
        type: "confirm",
        name: "hasProps",
        message: "Does your component has props?",
        default: true,
        cache: true
      });

      answers.hasProps = hasProps;

      if (hasProps) {
        answers.props = await getProperties();
      }

      return answers;
    };

    this.generator = await this.prompt([
      {
        name: "type",
        type: "list",
        message: "What would you like to scaffold?",
        choices: ["React Component", "Query", "Mutation"],
        default: "React Component"
      }
    ]);

    switch (this.generator.type) {
      case "Query":
        this.generator.query = await createQuery();
        this.generator.query.props = await getProperties();
        break;
      case "Mutation":
        this.generator.mutation = await createMutation();
        this.generator.mutation.props = await getProperties();
        break;
      case "React Component":
      default:
        this.generator.component = await createComponent();
        const files = await this.prompt([
          {
            name: "createStories",
            type: "confirm",
            message: "Do you want to create a story file?",
            default: true
          },
          {
            name: "createTests",
            type: "confirm",
            message: "Do you want to create a test file?",
            default: true
          },
          {
            name: "createQuery",
            type: "confirm",
            message: "Do you want to create a query file?",
            when: () => {
              return this.generator.component.addQuery;
            },
            default: true
          },
          {
            name: "createMutation",
            type: "confirm",
            message: "Do you want to create a mutation file?",
            when: () => {
              return this.generator.component.addMutation;
            },
            default: true
          }
        ]);

        if (files.createQuery) {
          this.generator.component.queryProps = await getProperties();
        }

        if (files.createMutation) {
          this.generator.component.mutationProps = await getProperties();
        }

        this.generator.component.createQuery = files.createQuery;
        this.generator.component.createMutation = files.createMutation;
        this.generator.component.createStories = files.createStories;
        this.generator.component.createTests = files.createTests;

        break;
    }

    console.log(this.generator);
  }

  writing() {
    const toCamelCase = value => {
      return value
        .split("_")
        .map((part, index) =>
          index === 0
            ? part.toLowerCase()
            : part.substr(0, 1) + part.substr(1).toLowerCase()
        )
        .join("");
    };

    const toPascalCase = value => {
      return value
        .split("_")
        .map(part => part.substr(0, 1) + part.substr(1).toLowerCase())
        .join("");
    };

    this.destinationRoot("./src");

    switch (this.generator.type) {
      case "Query":
        const { query } = this.generator;
        this.fs.copyTpl(
          this.templatePath(`_query.js.ejs`),
          this.destinationPath(
            `queries/${query.queryName
              .split("_")
              .map((part, index) =>
                index == 0
                  ? part.toLowerCase()
                  : part.substr(0, 1) + part.substr(1).toLowerCase()
              )
              .join("")}.js`
          ),
          {
            ...query,
            toCamelCase,
            toPascalCase
          }
        );
        break;
      case "Mutation":
        const { mutation } = this.generator;
        console.log("mutation:", mutation);
        this.fs.copyTpl(
          this.templatePath(`_mutation.js.ejs`),
          this.destinationPath(
            `mutations/${mutation.mutationName
              .split("_")
              .map((part, index) =>
                index == 0
                  ? part.toLowerCase()
                  : part.substr(0, 1) + part.substr(1).toLowerCase()
              )
              .join("")}.js`
          ),
          {
            ...mutation,
            toPascalCase,
            toCamelCase
          }
        );
        break;
      case "Component":
      default:
        const { component } = this.generator;
        const componentContext = {
          ...component,
          componentName: component.name,
          toCamelCase,
          toPascalCase,
        }
        this.fs.copyTpl(
          this.templatePath(`_component.jsx.ejs`),
          this.destinationPath(
            `components/${component.name}.jsx`
          ),
          componentContext
        );

        if (component.createQuery) {
          this.fs.copyTpl(
            this.templatePath(`_query.js.ejs`),
            this.destinationPath(
              `queries/${component.queryName
                .split("_")
                .map((part, index) =>
                  index == 0
                    ? part.toLowerCase()
                    : part.substr(0, 1) + part.substr(1).toLowerCase()
                )
                .join("")}.js`
            ),
            {
              ...componentContext,
              props: component.queryProps
            }
          );
        }

        if (component.createMutation) {
          this.fs.copyTpl(
            this.templatePath(`_mutation.js.ejs`),
            this.destinationPath(
              `mutations/${component.mutationName
                .split("_")
                .map((part, index) =>
                  index == 0
                    ? part.toLowerCase()
                    : part.substr(0, 1) + part.substr(1).toLowerCase()
                )
                .join("")}.js`
            ),
            {
              ...componentContext,
              props: component.mutationProps
            }
          );
        }

        if (component.createTests) {
          this.fs.copyTpl(
            this.templatePath(`_component.test.jsx.ejs`),
            this.destinationPath(
              `components/${component.name}.test.jsx`
            ),
            {
              ...componentContext,
              props: component.props
            }
          );
        }

        if (component.createStories) {
          this.fs.copyTpl(
            this.templatePath(`_component.stories.js.ejs`),
            this.destinationPath(
              `stories/${component.name}.stories.js`
            ),
            {
              ...componentContext,
              props: component.props
            }
          );
        }

        if (component.addPage) {
          this.fs.copyTpl(
            this.templatePath("_page.jsx.ejs"),
            this.destinationPath(
              `pages/${
                component.type == "Blank"
                  ? component.name.toLowerCase()
                  : component.entityName.toLowerCase() +
                    "/" +
                    component.type.toLowerCase()
              }.jsx`
            ),
            componentContext
          );
        }
        break;
    }
  }
};
