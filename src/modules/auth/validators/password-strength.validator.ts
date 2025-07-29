import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { UtilsService } from '../../../utils/services/utils.service';

@ValidatorConstraint({ name: 'isPasswordStrong', async: false })
export class IsPasswordStrong implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    const validation = UtilsService.validatePasswordStrength(password);
    return validation.isValid;
  }

  defaultMessage(args: ValidationArguments) {
    const validation = UtilsService.validatePasswordStrength(args.value);
    return validation.errors.join(', ');
  }
}
