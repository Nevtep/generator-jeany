'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  async prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(`Welcome to the prime ${chalk.cyan('Oasis React Toolkit')} generator!`)
    );

    
    const props = [];

    var propsPromps = [
      {
        type: 'input',
        name: 'name',
        message: "Enter the name of the property:",
      },
      {
        type: 'input',
        name: 'title',
        message: "Enter the title of the property:",
        default: function(answers) {
          return answers.name.substr(0,1).toUpperCase() + answers.name.substr(1);
        }
      },
      {
        type: 'confirm',
        name: 'isNumeric',
        message: 'Is a numeric property?',
        default: true
      },
      {
        type: 'confirm',
        name: 'addAnother',
        message: 'Add another property?',
        default: true
      }
    ];

    const getProperties = async () => {
      const {addAnother, ...property} = await this.prompt(propsPromps);
      props.push(property);
      if (addAnother) {
        await getProperties();
      } 
    }

    const createQuery = async () => {
      return await this.prompt([
        {
          name: 'entityName',
          message: 'Please enter your entity name:'
        },
        {
          name: 'queryName',
          message: 'Enter the query name:',
          default: function(answers) {
            return `GET_${answers.entityName.toUpperCase()}S`;
          },
        }
      ]);
    }

    const createStack = async () => {
      const prompts = [
        {
          name: 'entityName',
          message: 'Please enter your entity name:'
        },
        {
          type: 'confirm',
          name: 'addList',
          message: 'Do you want to add a list?',
          default: true,
        },
        {
          name: 'queryName',
          message: 'Enter the query name:',
          when: function(answers) {
            return answers.addList;
          },
          default: function(answers) {
            return `GET_${answers.entityName.toUpperCase()}S`;
          },
        },
        {
          type: 'confirm',
          name: 'addForm',
          message: 'Do you want to add a form?',
          default: true,
        },
        {
          name: 'mutationName',
          message: 'Enter the mutation name:',
          when: function(answers) {
            return answers.addForm;
          },
          default: function(answers) {
            return `CREATE_OR_UPDATE_${answers.entityName.toUpperCase()}`;
          },
        },
      ];

      return await this.prompt(prompts);
    }

    const createComponent = async () => {
      const prompts = [
        {
          name: 'type',
          type: 'list',
          message: 'What kind of component do you want to generate?',
          choices: ['List', 'Form', 'Blank'],
          default: 'List',
          cache: true,
        },
        {
          type: 'confirm',
          name: 'addQuery',
          message: 'Does your component use a Query?',
          default: function(answers) {
            return answers.type != 'Blank'
          },
          cache: true,
        },
        {
          name: 'queryName',
          message: 'Enter the query name:',
          when: function(answers) {
            return answers.addQuery;
          },
          default: 'GET_ENTITY',
          cache: true,
        },
        {
          type: 'confirm',
          name: 'addMutation',
          message: 'Does your component use a Mutation?',
          default: function(answers) {
            return answers.type == 'Form'
          },
          cache: true,
        },
        {
          name: 'mutationName',
          message: 'Enter the mutation name:',
          when: function(answers) {
            return answers.addMutation;
          },
          default: 'CREATE_OR_UPDATE_ENTITY',
          cache: true,
        },
        {
          name: 'name',
          message: 'Enter a name for your component:',
          when: function(answers) {
            return answers.type == 'Blank'
          },
          default: 'EntityComponent',
          cache: true,
        },
        {
          name: 'entityName',
          message: 'Enter a name for your entity:',
          when: function(answers) {
            return answers.type != 'Blank'
          },
          default: 'Entity',
          cache: true,
        },
        {
          type: 'confirm',
          name: 'addPage',
          message: 'Would you like to generate a page route for it?',
          default: true,
          cache: true,
        },
        {
          type: 'confirm',
          name: 'addScreen',
          message: 'Would you like to generate a screen component for it?',
          default: true,
          cache: true,
        }
      ];

      return await this.prompt(prompts);
    }

    this.generator = await this.prompt([{
      name: 'type',
      type: 'list',
      message: 'What would you like to scaffold?',
      choices: ['Stack','Component', 'Query'],
      default: 'Stack',
    }])

    switch(this.generator.type) {
      case 'Stack':
        this.generator.stack = await createStack();
        await getProperties();
        this.generator.stack.props = props;
        break;
      case 'Component':
        this.generator.component = await createComponent();
        if(this.generator.component.type !== 'Blank') {
          await getProperties();
          this.generator.component.props = props;
        }
        break;
      case 'Query':
        this.generator.query = await createQuery();
        await getProperties();
        this.generator.query.props = props;
    }

  }

  writing() {
    this.destinationRoot('./src');
    
    switch(this.generator.type) {
      case 'Stack':
        const { stack } = this.generator;
        const { entityName } = stack;
        const stackContext = {
          ...stack,
        }
        this.fs.copyTpl(
          this.templatePath(`_stack.tsx.ejs`),
          this.destinationPath(`screens/${entityName.toLowerCase()}s/Stack.tsx`),
          stackContext
        );
        if(stack.addList) {
          const navContext = {
            ...stackContext,
            type: 'List',
            componentName: `${stackContext.entityName}List`,
          }
          this.fs.copyTpl(
            this.templatePath(`_componentList.tsx.ejs`),
            this.destinationPath(`components/${entityName}List.tsx`),
            stackContext
          );
          this.fs.copyTpl(
            this.templatePath(`_entityRow.tsx.ejs`),
            this.destinationPath(`components/${entityName}Row.tsx`),
            stackContext
          );

          this.fs.copyTpl(
            this.templatePath('_page.tsx.ejs'),
            this.destinationPath(`pages/${entityName.toLowerCase()}s/list.tsx`),
            navContext
          );
    
          this.fs.copyTpl(
            this.templatePath('_screen.tsx.ejs'),
            this.destinationPath(`screens/${entityName.toLowerCase()}s/ListScreen.tsx`),
            navContext
          );

          this.fs.copyTpl(
            this.templatePath(`_query.ts.ejs`),
            this.destinationPath(`queries/${stackContext.queryName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
            stackContext
          );
          
        }
        if(stack.addForm) {
          const navContext = {
            ...stackContext,
            type: 'Form',
            componentName: `${stackContext.entityName}Form`,
          }
          this.fs.copyTpl(
            this.templatePath(`_componentForm.tsx.ejs`),
            this.destinationPath(`components/${entityName}Form.tsx`),
            stackContext
          );
          this.fs.copyTpl(
            this.templatePath('_page.tsx.ejs'),
            this.destinationPath(`pages/${entityName.toLowerCase()}s/form.tsx`),
            navContext
          );
    
          this.fs.copyTpl(
            this.templatePath('_screen.tsx.ejs'),
            this.destinationPath(`screens/${entityName.toLowerCase()}s/FormScreen.tsx`),
            navContext
          );

          this.fs.copyTpl(
            this.templatePath(`_query.ts.ejs`),
            this.destinationPath(`queries/${stackContext.queryName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
            stackContext
          );
          this.fs.copyTpl(
            this.templatePath(`_mutation.ts.ejs`),
            this.destinationPath(`mutations/${stackContext.mutationName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
            stackContext
          );
          
        }
        break;
      case 'Component':
        const { component } = this.generator;
        const componentContext = {
          ...component,
          componentName: component.type == 'Blank' ? component.name : component.entityName + component.type,
        }
        this.fs.copyTpl(
          this.templatePath(`_component${component.type}.tsx.ejs`),
          this.destinationPath(`components/${component.type == 'Blank' ? component.name : component.entityName + component.type}.tsx`),
          componentContext
        );
        if(component.type == 'List') {
          this.fs.copyTpl(
            this.templatePath(`_entityRow.tsx.ejs`),
            this.destinationPath(`components/${component.entityName}Row.tsx`),
            componentContext
          );
        }
        if(component.addQuery) {
          this.fs.copyTpl(
            this.templatePath(`_query.ts.ejs`),
            this.destinationPath(`queries/${component.queryName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
            componentContext
          );
        }
        if(component.addMutation) {
          this.fs.copyTpl(
            this.templatePath(`_mutation.ts.ejs`),
            this.destinationPath(`mutations/${component.mutationName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
            componentContext
          );
        }
        if(component.addPage) {
          this.fs.copyTpl(
            this.templatePath('_page.tsx.ejs'),
            this.destinationPath(`pages/${component.type == 'Blank' ? component.name.toLowerCase() : component.entityName.toLowerCase() + '/' + component.type.toLowerCase()}.tsx`),
            componentContext
          );
        }
    
        if(component.addScreen) {
          this.fs.copyTpl(
            this.templatePath('_screen.tsx.ejs'),
            this.destinationPath(`screens/${component.type == 'Blank' ? component.name : component.entityName + '/' + component.type}Screen.tsx`),
            componentContext
          );
        }
        break;
      case 'Query':
        const { query } = this.generator;
        this.fs.copyTpl(
          this.templatePath(`_query.ts.ejs`),
          this.destinationPath(`queries/${query.queryName.split('_').map((part, index) => index == 0 ? part.toLowerCase() : part.substr(0,1) + part.substr(1).toLowerCase()).join('')}.ts`),
          {
            ...query
          }
        );
        break;
    }
  }
};
