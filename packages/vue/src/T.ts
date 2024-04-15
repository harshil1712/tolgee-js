import {
  NsType,
  TranslateParams,
  TranslateProps,
  TranslationKey,
} from '@tolgee/web';
import { defineComponent, PropType, SetupContext, computed } from 'vue';
import { useTranslateInternal } from './useTranslateInternal';

export const T = defineComponent({
  name: 'T',
  props: {
    keyName: { type: String as PropType<TranslationKey>, required: true },
    params: Object as PropType<TranslateParams>,
    defaultValue: String as PropType<string>,
    noWrap: {
      type: Boolean,
      default: false,
    },
    ns: { type: String as PropType<NsType> },
    language: { type: String as PropType<string> },
  },
  setup(props, context: SetupContext) {
    const { slots } = context;
    const { t } = useTranslateInternal();
    const assignedParams = computed(() => {
      const slotsParams = {};
      Object.keys(slots).forEach((key) => {
        slotsParams[key] = slots[key]();
      });
      return Object.assign({}, props.params, slotsParams);
    });
    return { t, assignedParams };
  },
  render() {
    const params: TranslateProps = {
      key: this.$props.keyName,
      params: this.assignedParams,
      defaultValue: this.$props.defaultValue,
      noWrap: this.$props.noWrap,
      ns: this.$props.ns,
      language: this.$props.language,
    };
    const content = this.t(params);
    return content;
  },
});
