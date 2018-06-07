//外部依赖包
import React from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';
import AForm from 'antd/lib/form';
//内部依赖包
import event from '../../utils/event';
import { validateField } from '../../utils/util';
import defaultLoacale from '../../locale-provider/zh_CN';

class Form extends React.Component {
  static create() {
    class Decorator extends React.Component {
      static childContextTypes = {
        form: PropTypes.object,
        FormItem: PropTypes.func,
      };

      getChildContext() {
        return {
          form: this.form,
          //通过context传递给子组件使用，目前basic-component在使用
          //表单验证都是在这里处理的
          FormItem: getFormItemComponent(this),
        };
      }

      form = {
        /**
         * 获取一组输入控件的 Error ，如不传入参数，则获取全部组件的 Error
         * @param  {array} names name数组
         * @return {object} 返回指定fieldsError或者全部fieldsError
         */
        getFieldsError: names => {
          if (!names) {
            return this.fieldsError;
          } else if (names[0]) {
            const fieldsError = {};
            name.forEach(v => {
              if (this.fieldsError[v] !== undefined) {
                fieldsError[v] = this.fieldsError[v];
              }
            });
          }
        },
        /**
         * 获取某个输入表单控件的 Error
         * @param  {string} name 表单空间name值
         * @return {object} 返回指定fieldsError
         */
        getFieldError: name => {
          return this.fieldsError[name];
        },
        /**
         * 获取一组输入控件的值，如不传入参数，则获取全部组件的值
         * @param  {array} names name数组
         * @return {object} 返回指定fieldsValue或者全部fieldsValue
         */
        getFieldsValue: names => {
          if (!names) {
            return this.fieldsValue;
          } else if (names[0]) {
            const fieldsValue = {};
            name.forEach(v => {
              if (this.fieldsValue[v] !== undefined) {
                fieldsValue[v] = this.fieldsValue[v];
              }
            });
          }
        },
        /**
         * 获取某个输入表单控件的值
         * @param  {string} name 表单空间name值
         * @return {object} 返回指定fieldValue
         */
        getFieldValue: name => {
          return this.fieldsValue[name];
        },
        /**
         * 重置一组输入控件的值（为 initialValue）与状态，如不传入参数，则重置所有组件
         * @param {array} 表单names，即各个表单组件的name数组
         */
        resetFields: names => {
          this.trigger('form-reset-field-value', names);
        },
        /**
         * 设置一组输入控件的值
         * @param {object} fieldsValue 格式为{fieldName1: value1,fieldName2: value2}
         */
        setFieldsValue: fieldsValue => {
          for (let k in fieldsValue) {
            this.trigger('form-set-field-value-' + k, fieldsValue[k]);
          }
        },
        /**
         * 校验并获取一组输入域的值与 Error，若 fieldNames 参数为空，则校验全部组件
         * @param {array} 表单names，即各个表单组件的name数组，如果传入函数则变成callback参数
         * @param {function} callback function(err,fieldsValue){}
         */
        validateFields: (names, callback) => {
          let fieldsValidate = {};
          if (isFunction(names)) {
            //如果name是函数则变成callback
            callback = names;
            fieldsValidate = this.fieldsValidate;
          } else if (names && names[0]) {
            names.forEach(v => {
              fieldsValidate[v] = this.fieldsValue[v];
            });
          } else {
            fieldsValidate = this.fieldsValidate;
          }
          const fieldsValidateArray = [];
          for (let k in fieldsValidate) {
            fieldsValidateArray.push(fieldsValidate[k]());
          }
          Promise.all(fieldsValidateArray)
            .then(errors => {
              let fieldsError;
              errors.forEach(v => {
                if (v && v[0] && v[0].field) {
                  if (!fieldsError) {
                    fieldsError = {};
                  }
                  fieldsError[v[0].field] = v;
                }
              });
              return fieldsError;
            })
            .then(errors => {
              callback &&
                callback(errors, !!errors ? undefined : this.fieldsValue);
            });
        },
      };
      //存放各个filed的验证方法
      fieldsValidate = {};
      fieldsValue = {};
      fieldsError = {};
      //v17.0版本后会移除componentWillMount
      componentWillMount() {
        this.on('form-values', ({ name, fieldValue }) => {
          if (fieldValue) {
            this.fieldsValue[name] = fieldValue;
          } else {
            delete this.fieldsValue[name];
          }
        });
        this.on('form-errors', ({ name, fieldError }) => {
          if (fieldError) {
            this.fieldsError[name] = fieldError;
          } else {
            delete this.fieldsError[name];
          }
        });
      }
      //兼容后续新版本componentWillMount
      UNSAFE_componentWillMount() {
        this.componentWillMount();
      }
      componentWillUnmount() {
        this.off();
      }
      render() {
        let WrapperComponent = this.getWrapperComponent();
        return <WrapperComponent {...this.props} form={this.form} />;
      }
    }
    //整合backbone全局事件处理方式
    Object.assign(Decorator.prototype, event);
    return WrappedComponent => {
      function getDisplayName(WrappedComponent) {
        return (
          WrappedComponent.displayName ||
          WrappedComponent.name ||
          'WrappedComponent'
        );
      }
      Decorator.displayName = `Form(${getDisplayName(WrappedComponent)})`;
      Decorator.prototype.getWrapperComponent = () => WrappedComponent;
      return Decorator;
    };
  }
  static propTypes = {
    size: PropTypes.string,
    hasFeedback: PropTypes.bool,
    labelCol: PropTypes.object,
    wrapperCol: PropTypes.object,
    locale: PropTypes.object,
  };
  static contextTypes = {
    antLocale: PropTypes.object,
  };
  static childContextTypes = {
    size: PropTypes.string,
    hasFeedback: PropTypes.bool,
    labelCol: PropTypes.object,
    wrapperCol: PropTypes.object,
    locale: PropTypes.object,
  };
  getChildContext() {
    return {
      size: this.props.size,
      hasFeedback: this.props.hasFeedback,
      labelCol: this.props.labelCol,
      wrapperCol: this.props.wrapperCol,
      locale: this.locale,
    };
  }
  get locale() {
    return {
      ...defaultLoacale,
      ...this.context.antLocale,
      ...this.props.locale,
    };
  }
  render() {
    const { ...other } = this.props;
    //为了防止传递给原生form，react会报错。
    delete other.locale;
    delete other.hasFeedback;
    delete other.labelCol;
    delete other.wrapperCol;
    delete other.size;
    return <AForm {...other}>{this.props.children}</AForm>;
  }
}
function getFormItemComponent(that) {
  return class extends React.Component {
    state = {
      value: this.props.initialValue,
      //有初始值则需要验证是否合法才给渲染，否则不用。
      canBeRendered: this.props.initialValue ? false : true,
    };
    static contextTypes = {
      size: PropTypes.string,
      hasFeedback: PropTypes.bool,
      labelCol: PropTypes.object,
      wrapperCol: PropTypes.object,
      formItemProps: PropTypes.object,
    };
    name = this.props.name;
    componentWillUnmount() {
      that.off('form-set-field-value-' + this.name);
    }
    componentDidMount() {
      const name = this.name;
      if (this.props.initialValue) {
        //设置初始化默认值
        that.fieldsValue[name] = this.props.initialValue;
        //验证默认值是否合法
        this.validateField(name, this.props.initialValue, this.props.rules);
      }
      if (!this.props.noFormItem) {
        that.fieldsValidate[name] = () => {
          const { value } = this.state;
          return this.validateField(this.name, value, this.props.rules);
        };
      }
      that.on('form-set-field-value-' + name, value => {
        this.validateField(this.name, value, this.props.rules);
      });
      that.on('form-reset-field-value', names => {
        const resetValue = () => {
          this.setState({
            value: this.props.initialValue,
            errors: undefined,
          });
          that.trigger('form-values', {
            name,
            fieldValue: this.props.initialValue,
          });
          that.trigger('form-errors', {
            name,
          });
        };
        if (names && names[0]) {
          if (!!~names.indexOf(name)) {
            //names存在值一致的${name}则重置
            resetValue();
          }
        } else if (!name) {
          resetValue();
        }
      });
    }
    validateField(name, value, rules) {
      return new Promise(resolve => {
        validateField(name, value, rules)(
          () => {
            this.setState({
              value,
              errors: undefined,
              canBeRendered: true,
            });
            that.trigger('form-values', {
              name,
              fieldValue: value,
            });
            that.trigger('form-errors', {
              name,
            });
            resolve();
          },
          errors => {
            this.setState({
              value,
              errors,
              canBeRendered: true,
            });
            that.trigger('form-values', {
              name,
            });
            that.trigger('form-errors', {
              name,
              fieldError: errors,
            });
            resolve(errors);
          }
        );
      });
    }
    onChange = e => {
      const { onChange, noFormItem, type } = this.props;
      let value;
      if (!e) {
        value = undefined;
      } else if (e.target) {
        value = e.target.value;
      } else {
        value = e;
      }
      if (type === 'file') {
        //特殊处理type=file的情况
        value = e.target.files[0];
      }
      if (type === 'checkbox') {
        //特殊处理type=file的情况
        if (e.target.checked) {
          value = e.target.checked;
        } else {
          value = '';
        }
      }
      if (!noFormItem) {
        this.validateField(this.name, value, this.props.rules);
      } else {
        this.setState({ value });
      }
      onChange && onChange(e);
    };
    getErrorMessage() {
      if (!this.props.noFormItem) {
        const { errors } = this.state;
        let message = '';
        errors &&
          errors.forEach((v, k) => {
            if (k !== 0) {
              message += ',' + v.message;
            } else {
              message += v.message;
            }
          });
        return message;
      }
    }
    getValidateStatus() {
      if (!this.props.noFormItem) {
        const { errors, value } = this.state;
        if (errors) {
          return 'error';
        } else if (value) {
          return 'success';
        }
      }
    }
    renderItem(otherItemProps) {
      const context = this.context;
      this.deleteUnuseProps(otherItemProps);
      const { children, ...other } = otherItemProps;
      return React.cloneElement(children, {
        size: context.size,
        ...other,
        onChange: this.onChange,
        id: 'afc-form-item-' + name,
      });
    }
    deleteUnuseProps(otherItemProps) {
      delete otherItemProps.onlyLetter;
      delete otherItemProps.min;
      delete otherItemProps.max;
      delete otherItemProps.initialValue;
      delete otherItemProps.name;
    }
    render() {
      if (!this.state.canBeRendered) {
        return false;
      }
      const help = this.getErrorMessage();
      const validateStatus = this.getValidateStatus();
      const context = this.context;
      const { required, label, noFormItem, ...otherItemProps } = this.props;
      if (otherItemProps.type !== 'file') {
        //input type=file是不受控表单
        otherItemProps.value = this.state.value;
      }
      let hasFeedback = context.hasFeedback;
      if (
        otherItemProps.type === 'radio-group' ||
        otherItemProps.type === 'checkbox' ||
        otherItemProps.type === 'checkbox-group'
      ) {
        //checkbox不需要feedback提示，影响布局美观
        hasFeedback = false;
      }
      if (noFormItem || otherItemProps.type === 'hidden') {
        return this.renderItem(otherItemProps);
      } else {
        return (
          <AForm.Item
            hasFeedback={hasFeedback}
            wrapperCol={context.wrapperCol}
            labelCol={context.labelCol}
            {...context.formItemProps}
            help={help}
            validateStatus={validateStatus}
            label={label}
            required={required}
          >
            {this.renderItem(otherItemProps)}
          </AForm.Item>
        );
      }
    }
  };
}
Form.Item = class FormItem extends React.Component {
  //Form.Item只是为了传递props到antd的Form.Item
  //如果没用到Form.Item的props，可以不使用。
  static childContextTypes = {
    formItemProps: PropTypes.object,
  };
  getChildContext() {
    return {
      formItemProps: this.props,
    };
  }
  render() {
    return this.props.children;
  }
};

export default Form;
